package com.allyson.controlegastos.service;

import com.allyson.controlegastos.config.JwtService;
import com.allyson.controlegastos.dto.AuthResponse;
import com.allyson.controlegastos.dto.CadastroRequest;
import com.allyson.controlegastos.dto.LoginRequest;
import com.allyson.controlegastos.model.Usuario;
import com.allyson.controlegastos.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse cadastrar(CadastroRequest request) {
        if (repository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("E-mail já cadastrado!");
        }
        Usuario usuario = Usuario.builder()
                .nome(request.nome())
                .email(request.email())
                .senha(passwordEncoder.encode(request.senha()))
                .build();
        repository.save(usuario);
        return new AuthResponse(jwtService.gerarToken(usuario), usuario.getNome(), usuario.getEmail());
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.senha())
        );
        Usuario usuario = repository.findByEmail(request.email()).orElseThrow();
        return new AuthResponse(jwtService.gerarToken(usuario), usuario.getNome(), usuario.getEmail());
    }
}
