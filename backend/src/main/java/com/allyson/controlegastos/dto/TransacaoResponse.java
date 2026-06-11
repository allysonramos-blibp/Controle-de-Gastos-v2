package com.allyson.controlegastos.dto;

import com.allyson.controlegastos.model.Categoria;
import com.allyson.controlegastos.model.TipoPagamento;
import com.allyson.controlegastos.model.TipoTransacao;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransacaoResponse(
        Long id,
        String descricao,
        BigDecimal valor,
        LocalDate data,
        Categoria categoria,
        TipoPagamento tipoPagamento,
        TipoTransacao tipo,
        Integer parcelaAtual,
        Integer totalParcelas
) {}