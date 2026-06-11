package com.allyson.controlegastos.service;

import com.allyson.controlegastos.dto.TransacaoRequest;
import com.allyson.controlegastos.dto.TransacaoResponse;
import com.allyson.controlegastos.exception.ResourceNotFoundException;
import com.allyson.controlegastos.model.*;
import com.allyson.controlegastos.repository.FaturaRepository;
import com.allyson.controlegastos.repository.TransacaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransacaoService {

    private final TransacaoRepository transacaoRepository;
    private final FaturaRepository faturaRepository;

    public List<TransacaoResponse> listarTodas(Usuario usuario) {
        return transacaoRepository.findByUsuarioIdOrderByDataDesc(usuario.getId())
                .stream().map(this::toResponse).toList();
    }

    public List<TransacaoResponse> listarPorMesAno(Usuario usuario, int mes, int ano) {
        return transacaoRepository.findByUsuarioAndMesAno(usuario.getId(), mes, ano)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public List<TransacaoResponse> salvar(Usuario usuario, TransacaoRequest request) {
        if (request.totalParcelas() != null && request.totalParcelas() > 1) {
            return salvarParcelada(usuario, request);
        }
        Transacao t = buildTransacao(usuario, request, null, null, request.data(), request.valor());
        atualizarFatura(usuario, transacaoRepository.save(t));
        return List.of(toResponse(transacaoRepository.save(t)));
    }

    private List<TransacaoResponse> salvarParcelada(Usuario usuario, TransacaoRequest base) {
        int qtd = base.totalParcelas();
        BigDecimal valorParcela = base.valor().divide(BigDecimal.valueOf(qtd), 2, RoundingMode.HALF_UP);

        List<TransacaoResponse> parcelas = new ArrayList<>();
        for (int i = 1; i <= qtd; i++) {
            LocalDate data = base.data().plusMonths(i - 1);
            Transacao t = buildTransacao(usuario, base, i, qtd, data, valorParcela);
            Transacao salva = transacaoRepository.save(t);
            atualizarFatura(usuario, salva);
            parcelas.add(toResponse(salva));
        }
        return parcelas;
    }

    @Transactional
    public TransacaoResponse atualizar(Usuario usuario, Long id, TransacaoRequest request) {
        Transacao t = transacaoRepository.findByIdAndUsuarioId(id, usuario.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada"));
        t.setDescricao(request.descricao());
        t.setValor(request.valor());
        t.setData(request.data());
        t.setCategoria(request.categoria());
        t.setTipo(request.tipo());
        t.setTipoPagamento(request.tipoPagamento());
        return toResponse(transacaoRepository.save(t));
    }

    @Transactional
    public void deletar(Usuario usuario, Long id) {
        Transacao t = transacaoRepository.findByIdAndUsuarioId(id, usuario.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada"));
        transacaoRepository.delete(t);
    }

    public TransacaoResponse buscarPorId(Usuario usuario, Long id) {
        return transacaoRepository.findByIdAndUsuarioId(id, usuario.getId())
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada"));
    }

    private void atualizarFatura(Usuario usuario, Transacao t) {
        if (t.getTipoPagamento() != TipoPagamento.CARTAO_CREDITO) return;
        int mes = t.getData().getMonthValue();
        int ano = t.getData().getYear();
        Fatura fatura = faturaRepository.findByUsuarioIdAndMesAndAno(usuario.getId(), mes, ano)
                .orElseGet(() -> faturaRepository.save(Fatura.builder()
                        .usuario(usuario).mes(mes).ano(ano)
                        .total(BigDecimal.ZERO).status(StatusFatura.ABERTA).build()));
        fatura.setTotal(fatura.getTotal().add(t.getValor()));
        faturaRepository.save(fatura);
    }

    private Transacao buildTransacao(Usuario usuario, TransacaoRequest req,
                                     Integer parcelaAtual, Integer totalParcelas,
                                     LocalDate data, BigDecimal valor) {
        String descricao = parcelaAtual != null
                ? req.descricao() + " (" + parcelaAtual + "/" + totalParcelas + ")"
                : req.descricao();
        return Transacao.builder()
                .usuario(usuario).descricao(descricao).valor(valor).data(data)
                .categoria(req.categoria()).tipo(req.tipo()).tipoPagamento(req.tipoPagamento())
                .parcelaAtual(parcelaAtual).totalParcelas(totalParcelas)
                .build();
    }

    public TransacaoResponse toResponse(Transacao t) {
        return new TransacaoResponse(
                t.getId(), t.getDescricao(), t.getValor(), t.getData(),
                t.getCategoria(), t.getTipoPagamento(), t.getTipo(),
                t.getParcelaAtual(), t.getTotalParcelas()
        );
    }
}
