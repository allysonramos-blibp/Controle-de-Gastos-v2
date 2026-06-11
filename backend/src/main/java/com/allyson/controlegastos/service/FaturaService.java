package com.allyson.controlegastos.service;

import com.allyson.controlegastos.dto.FaturaResponse;
import com.allyson.controlegastos.exception.ResourceNotFoundException;
import com.allyson.controlegastos.model.*;
import com.allyson.controlegastos.repository.FaturaRepository;
import com.allyson.controlegastos.repository.TransacaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FaturaService {

    private final FaturaRepository faturaRepository;
    private final TransacaoRepository transacaoRepository;
    private final TransacaoService transacaoService;

    public List<FaturaResponse> listarTodas(Usuario usuario) {
        return faturaRepository.findByUsuarioIdOrderByAnoDescMesDesc(usuario.getId())
                .stream().map(f -> toResponse(f, usuario)).toList();
    }

    public FaturaResponse buscarOuCriar(Usuario usuario, int mes, int ano) {
        Fatura fatura = faturaRepository.findByUsuarioIdAndMesAndAno(usuario.getId(), mes, ano)
                .orElseGet(() -> faturaRepository.save(Fatura.builder()
                        .usuario(usuario).mes(mes).ano(ano)
                        .total(BigDecimal.ZERO).status(StatusFatura.ABERTA).build()));

        BigDecimal total = transacaoRepository
                .findByUsuarioAndTipoPagamentoAndMesAno(usuario.getId(), TipoPagamento.CARTAO_CREDITO, mes, ano)
                .stream().map(Transacao::getValor).reduce(BigDecimal.ZERO, BigDecimal::add);

        if (fatura.getTotal().compareTo(total) != 0) {
            fatura.setTotal(total);
            faturaRepository.save(fatura);
        }
        return toResponse(fatura, usuario);
    }

    @Transactional
    public void pagar(Usuario usuario, Long faturaId) {
        Fatura fatura = faturaRepository.findByIdAndUsuarioId(faturaId, usuario.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Fatura não encontrada"));
        if (fatura.getStatus() == StatusFatura.PAGA) {
            throw new IllegalArgumentException("Fatura já está paga!");
        }
        transacaoRepository.deleteByUsuarioAndTipoPagamentoAndMesAno(
                usuario.getId(), TipoPagamento.CARTAO_CREDITO, fatura.getMes(), fatura.getAno());
        fatura.setStatus(StatusFatura.PAGA);
        faturaRepository.save(fatura);
    }

    private FaturaResponse toResponse(Fatura f, Usuario usuario) {
        var transacoes = transacaoRepository
                .findByUsuarioAndTipoPagamentoAndMesAno(
                        usuario.getId(), TipoPagamento.CARTAO_CREDITO, f.getMes(), f.getAno())
                .stream().map(transacaoService::toResponse).toList();
        return new FaturaResponse(f.getId(), f.getMes(), f.getAno(), f.getTotal(), f.getStatus(), transacoes);
    }
}
