package com.allyson.controlegastos.dto;

import com.allyson.controlegastos.model.Categoria;
import com.allyson.controlegastos.model.TipoPagamento;
import com.allyson.controlegastos.model.TipoTransacao;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransacaoRequest(
        @NotBlank String descricao,
        @NotNull @DecimalMin("0.01") BigDecimal valor,
        @NotNull LocalDate data,
        @NotNull Categoria categoria,
        @NotNull TipoPagamento tipoPagamento,
        @NotNull TipoTransacao tipo,
        @Min(1) @Max(72) Integer totalParcelas
) {}