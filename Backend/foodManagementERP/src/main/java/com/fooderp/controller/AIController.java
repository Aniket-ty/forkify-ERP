package com.fooderp.controller;

import com.fooderp.service.AIContextService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * AIController — Groq-powered chat endpoint enhanced with live database context.
 *
 * HOW IT WORKS:
 *   1. Frontend sends { branchId, contextType, system (optional), messages }
 *   2. AIContextService queries the live DB and builds a structured context block
 *      containing ALL recipes, inventory, sales, wastage, suppliers, meal plans
 *   3. That context is injected into the system prompt BEFORE the frontend's
 *      own prompt — so the AI always has full, live, accurate data
 *   4. Groq LLM (llama-3.3-70b) answers with complete awareness of your database
 *
 * contextType controls which data sections are loaded (saves tokens):
 *   "recipe"    — recipes + ingredients
 *   "inventory" — stock levels
 *   "sales"     — last-30-day sales
 *   "wastage"   — wastage records
 *   "supplier"  — supplier list
 *   "meal"      — active meal plans
 *   "all" / ""  — everything (default)
 */
@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AIController {

    @Value("${groq.api.key:}")
    private String groqApiKey;

    @Autowired
    private AIContextService aiContextService;

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String GROQ_URL =
            "https://api.groq.com/openai/v1/chat/completions";

    // ── POST /api/ai/chat ─────────────────────────────────────────────────────
    // Request body:
    //   {
    //     "branchId":    123,            // optional — null = HQ sees all
    //     "contextType": "recipe,sales", // optional — controls which DB sections load
    //     "system":      "...",          // optional — frontend's own system prompt
    //     "messages":    [{role, content}]
    //   }
    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody Map<String, Object> body) {

        if (groqApiKey == null || groqApiKey.isBlank()) {
            return ResponseEntity
                    .status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error",
                            "Groq API key not configured. Get a free key at " +
                            "https://console.groq.com and add 'groq.api.key=gsk_...' " +
                            "to application.properties"));
        }

        try {
            // ── 1. Extract request fields ──────────────────────────────────
            String frontendSystem = (String) body.getOrDefault("system", "");
            String contextType    = (String) body.getOrDefault("contextType", "all");
            Long   branchId       = null;
            Object branchRaw      = body.get("branchId");
            if (branchRaw instanceof Number) {
                branchId = ((Number) branchRaw).longValue();
            } else if (branchRaw instanceof String && !((String) branchRaw).isBlank()) {
                try { branchId = Long.parseLong((String) branchRaw); } catch (NumberFormatException ignored) {}
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> userMessages =
                    (List<Map<String, Object>>) body.getOrDefault("messages", List.of());

            // ── 2. Build live database context ─────────────────────────────
            String dbContext = aiContextService.buildContext(branchId, contextType);

            // ── 3. Compose final system prompt ─────────────────────────────
            String systemPrompt = buildSystemPrompt(frontendSystem, dbContext, branchId);

            // ── 4. Build Groq messages array ───────────────────────────────
            List<Map<String, Object>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemPrompt));
            messages.addAll(userMessages);

            // ── 5. Call Groq ───────────────────────────────────────────────
            Map<String, Object> groqBody = new LinkedHashMap<>();
            groqBody.put("model", "llama-3.3-70b-versatile");
            groqBody.put("messages", messages);
            groqBody.put("max_tokens", 2000);  // increased from 1000 — more complete answers
            groqBody.put("temperature", 0.4);  // lower = more factual, less hallucination

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(groqApiKey);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(groqBody, headers);
            ResponseEntity<Map> groqResponse = restTemplate.exchange(
                    GROQ_URL, HttpMethod.POST, request, Map.class);

            String replyText = extractGroqText(groqResponse.getBody());

            // Return in shape the frontend expects
            return ResponseEntity.ok(Map.of(
                    "content", List.of(Map.of("type", "text", "text", replyText))
            ));

        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("error", "AI request failed: " + e.getMessage()));
        }
    }

    // ── Build the master system prompt ────────────────────────────────────────
    private String buildSystemPrompt(String frontendPrompt, String dbContext, Long branchId) {
        StringBuilder sb = new StringBuilder();

        sb.append("You are an intelligent AI assistant embedded in Forkify ERP — a restaurant management system.\n");
        sb.append("You have DIRECT ACCESS to the live database. The data below is current and complete.\n");
        sb.append("NEVER say you don't have data. NEVER invent items that aren't in the data.\n");
        sb.append("Always answer using the exact figures from the data provided.\n");
        if (branchId != null) {
            sb.append("Context scope: Branch ID ").append(branchId).append(" (branch-level view).\n");
        } else {
            sb.append("Context scope: HQ (all branches visible).\n");
        }
        sb.append("\n");
        sb.append("============================================================\n");
        sb.append("LIVE DATABASE SNAPSHOT\n");
        sb.append("============================================================\n");
        sb.append(dbContext);
        sb.append("\n============================================================\n");
        sb.append("END OF DATABASE SNAPSHOT\n");
        sb.append("============================================================\n\n");

        if (frontendPrompt != null && !frontendPrompt.isBlank()) {
            sb.append("ADDITIONAL INSTRUCTIONS FROM THE APPLICATION:\n");
            sb.append(frontendPrompt).append("\n\n");
        }

        sb.append("RESPONSE RULES:\n");
        sb.append("1. Use ONLY data from the database snapshot above. Never guess or invent.\n");
        sb.append("2. Be concise, structured and use bullet points or tables where helpful.\n");
        sb.append("3. For calorie/nutrition queries: list individual items AND suggest 2-4 meal combos with totals.\n");
        sb.append("4. For inventory queries: reference actual stock levels, statuses, and costs from the data.\n");
        sb.append("5. For sales queries: use the actual revenue figures provided.\n");
        sb.append("6. Always use Rs (rupee symbol) for currency values.\n");
        sb.append("7. Respond in the same language the user writes in.\n");

        return sb.toString();
    }

    // ── Extract text from Groq/OpenAI response format ─────────────────────────
    @SuppressWarnings("unchecked")
    private String extractGroqText(Map<?, ?> body) {
        if (body == null) return "Sorry, I could not generate a response.";
        try {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) body.get("choices");
            if (choices == null || choices.isEmpty()) return "No response generated.";
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            if (message == null) return "Empty response from AI.";
            return (String) message.getOrDefault("content", "No content in response.");
        } catch (Exception e) {
            return "Could not parse AI response: " + e.getMessage();
        }
    }
}
