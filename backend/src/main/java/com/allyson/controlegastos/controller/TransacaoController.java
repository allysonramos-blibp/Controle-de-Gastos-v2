package com.allyson.controlegastos.controller;

import com.allyson.controlegastos.dto.TransacaoRequest;
import com.allyson.controlegastos.dto.TransacaoResponse;
import com.allyson.controlegastos.model.Usuario;
import com.allyson.controlegastos.service.TransacaoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transacoes")
@RequiredArgsConstructor
public class TransacaoController {

    private final TransacaoService service;

    @GetMapping
    public List<TransacaoResponse> listarTodas(@AuthenticationPrincipal Usuario usuario) {
        return service.listarTodas(usuario);
    }

    @GetMapping("/filtro")
    public List<TransacaoResponse> listarPorMes(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam int mes,
            @RequestParam int ano) {
        return service.listarPorMesAno(usuario, mes, ano);
    }

    @GetMapping("/{id}")
    public TransacaoResponse buscarPorId(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable Long id) {
        return service.buscarPorId(usuario, id);
    }

    @PostMapping
    public ResponseEntity<List<TransacaoResponse>> salvar(
            @AuthenticationPrincipal Usuario usuario,
            @Valid @RequestBody TransacaoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.salvar(usuario, req));
    }

    @PutMapping("/{id}")
    public TransacaoResponse atualizar(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable Long id,
            @Valid @RequestBody TransacaoRequest req) {
        return service.atualizar(usuario, id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable Long id) {
        service.deletar(usuario, id);
        return ResponseEntity.noContent().build();
    }
}
