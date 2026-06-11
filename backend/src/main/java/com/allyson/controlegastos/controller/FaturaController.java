package com.allyson.controlegastos.controller;

import com.allyson.controlegastos.dto.FaturaResponse;
import com.allyson.controlegastos.model.Usuario;
import com.allyson.controlegastos.service.FaturaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/faturas")
@RequiredArgsConstructor
public class FaturaController {

    private final FaturaService service;

    @GetMapping
    public List<FaturaResponse> listarTodas(@AuthenticationPrincipal Usuario usuario) {
        return service.listarTodas(usuario);
    }

    @GetMapping("/buscar")
    public FaturaResponse buscar(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam int mes,
            @RequestParam int ano) {
        return service.buscarOuCriar(usuario, mes, ano);
    }

    @PostMapping("/{id}/pagar")
    public ResponseEntity<Void> pagar(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable Long id) {
        service.pagar(usuario, id);
        return ResponseEntity.ok().build();
    }
}
