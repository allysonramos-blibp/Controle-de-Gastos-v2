package com.allyson.controlegastos.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record DashboardResponse(
        BigDecimal totalReceitas,
        BigDecimal totalDespesas,
        BigDecimal saldo,
        Map<String, BigDecimal> gastosPorCategoria,
        List<ResumoMensal> resumoMensal
) {
    public record ResumoMensal(
            String mes,
            BigDecimal receitas,
            BigDecimal despesas
    ) {}
}