package com.fooderp.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * WebConfig
 *
 * Registers the AuditInterceptor so it fires on every HTTP request.
 * The interceptor itself filters to only log POST/PUT/DELETE/PATCH.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final HandlerInterceptor auditInterceptor;

    public WebConfig(HandlerInterceptor auditInterceptor) {
        this.auditInterceptor = auditInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(auditInterceptor)
                .addPathPatterns("/api/**");
    }
}

