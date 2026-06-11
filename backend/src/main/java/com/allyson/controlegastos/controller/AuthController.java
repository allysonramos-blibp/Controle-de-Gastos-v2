package com.allyson.controlegastos.controller;

import com.allyson.controlegastos.dto.AuthResponse;
import com.allyson.controlegastos.dto.CadastroRequest;
import com.allyson.controlegastos.dto.LoginRequest;
import com.allyson.controlegastos.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UsuarioService service;

    @PostMapping("/cadastrar")
    public ResponseEntity<AuthResponse> cadastrar(@Valid @RequestBody CadastroRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.cadastrar(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(service.login(req));
    }
}
