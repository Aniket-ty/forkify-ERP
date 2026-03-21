package com.fooderp.controller;

import com.fooderp.dto.JwtResponse;
import com.fooderp.dto.LoginRequest;
import com.fooderp.dto.RegisterRequest;
import com.fooderp.entity.Branch;
import com.fooderp.entity.Role;
import com.fooderp.entity.User;
import com.fooderp.repository.BranchRepository;
import com.fooderp.repository.UserRepository;
import com.fooderp.security.JwtUtils;
import com.fooderp.security.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired AuthenticationManager authenticationManager;
    @Autowired UserRepository        userRepository;
    @Autowired BranchRepository      branchRepository;
    @Autowired PasswordEncoder        passwordEncoder;
    @Autowired JwtUtils               jwtUtils;

    // ── POST /api/auth/login ─────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        return ResponseEntity.ok(new JwtResponse(
                jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                userDetails.getFullName(),
                userDetails.getRole(),
                userDetails.getBranchId(),
                userDetails.getBranchName()
        ));
    }

    // ── POST /api/auth/register ───────────────────────────────────────────────
    // Public self-registration — always creates ROLE_USER with no branch.
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {

        if (userRepository.existsByUsername(req.getUsername())) {
            return ResponseEntity.badRequest().body("Error: Username is already taken!");
        }
        if (userRepository.existsByEmail(req.getEmail())) {
            return ResponseEntity.badRequest().body("Error: Email is already in use!");
        }

        User user = new User();
        user.setUsername(req.getUsername());
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setFullName(req.getFullName());
        user.setRole(Role.ROLE_USER);
        // branch left null — admin assigns it later

        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully!");
    }

    // ── GET /api/auth/me ─────────────────────────────────────────────────────
    // Lets the frontend refresh user info without re-logging in.
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return ResponseEntity.ok(new JwtResponse(
                null,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                userDetails.getFullName(),
                userDetails.getRole(),
                userDetails.getBranchId(),
                userDetails.getBranchName()
        ));
    }
}