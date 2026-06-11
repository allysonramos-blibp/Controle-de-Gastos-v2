package com.allyson.controlegastos.service;

import com.allyson.controlegastos.dto.DashboardResponse;
import com.allyson.controlegastos.model.*;
import com.allyson.controlegastos.repository.TransacaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final TransacaoRepository transacaoRepository;

    public DashboardResponse getDashboard(Usuario usuario, int mes, int ano) {
        List<Transacao> transacoes = transacaoRepository.findByUsuarioAndMesAno(usuario.getId(), mes, ano);

        BigDecimal receitas = somarPorTipo(transacoes, TipoTransacao.RECEITA);
        BigDecimal despesas = somarPorTipo(transacoes, TipoTransacao.DESPESA);

        Map<String, BigDecimal> porCategoria = transacoes.stream()
                .filter(t -> t.getTipo() == TipoTransacao.DESPESA)
                .collect(Collectors.groupingBy(
                        t -> t.getCategoria().name(),
                        Collectors.reducing(BigDecimal.ZERO, Transacao::getValor, BigDecimal::add)
                ));

        List<DashboardResponse.ResumoMensal> resumo = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDate ref = LocalDate.of(ano, mes, 1).minusMonths(i);
            List<Transacao> mesTrans = transacaoRepository
                    .findByUsuarioAndMesAno(usuario.getId(), ref.getMonthValue(), ref.getYear());
            resumo.add(new DashboardResponse.ResumoMensal(
                    ref.getMonth().getDisplayName(TextStyle.SHORT, new Locale("pt", "BR")),
                    somarPorTipo(mesTrans, TipoTransacao.RECEITA),
                    somarPorTipo(mesTrans, TipoTransacao.DESPESA)
            ));
        }

        return new DashboardResponse(receitas, despesas, receitas.subtract(despesas), porCategoria, resumo);
    }

    private BigDecimal somarPorTipo(List<Transacao> transacoes, TipoTransacao tipo) {
        return transacoes.stream()
                .filter(t -> t.getTipo() == tipo)
                .map(Transacao::getValor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
