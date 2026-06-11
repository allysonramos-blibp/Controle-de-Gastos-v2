package com.allyson.controlegastos.controller;

import com.allyson.controlegastos.dto.DashboardResponse;
import com.allyson.controlegastos.model.Usuario;
import com.allyson.controlegastos.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService service;

    @GetMapping
    public DashboardResponse dashboard(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam(defaultValue = "0") int mes,
            @RequestParam(defaultValue = "0") int ano) {
        if (mes == 0) mes = LocalDate.now().getMonthValue();
        if (ano == 0) ano = LocalDate.now().getYear();
        return service.getDashboard(usuario, mes, ano);
    }
}
