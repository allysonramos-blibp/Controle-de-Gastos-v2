package com.allyson.controlegastos.dto;

public record AuthResponse(
        String token,
        String nome,
        String email
) {}