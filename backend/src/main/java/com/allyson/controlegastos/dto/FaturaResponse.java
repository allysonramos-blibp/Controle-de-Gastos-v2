package com.allyson.controlegastos.dto;

import com.allyson.controlegastos.model.StatusFatura;

import java.math.BigDecimal;
import java.util.List;

public record FaturaResponse(
        Long id,
        Integer mes,
        Integer ano,
        BigDecimal total,
        StatusFatura status,
        List<TransacaoResponse> transacoes
) {}