package com.allyson.controlegastos.repository;

import com.allyson.controlegastos.model.TipoPagamento;
import com.allyson.controlegastos.model.Transacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface TransacaoRepository extends JpaRepository<Transacao, Long> {

    List<Transacao> findByUsuarioIdOrderByDataDesc(Long usuarioId);

    @Query("SELECT t FROM Transacao t WHERE t.usuario.id = :usuarioId " +
           "AND MONTH(t.data) = :mes AND YEAR(t.data) = :ano ORDER BY t.data DESC")
    List<Transacao> findByUsuarioAndMesAno(
            @Param("usuarioId") Long usuarioId,
            @Param("mes") int mes,
            @Param("ano") int ano);

    @Query("SELECT t FROM Transacao t WHERE t.usuario.id = :usuarioId " +
           "AND t.tipoPagamento = :tipo " +
           "AND MONTH(t.data) = :mes AND YEAR(t.data) = :ano")
    List<Transacao> findByUsuarioAndTipoPagamentoAndMesAno(
            @Param("usuarioId") Long usuarioId,
            @Param("tipo") TipoPagamento tipo,
            @Param("mes") int mes,
            @Param("ano") int ano);

    Optional<Transacao> findByIdAndUsuarioId(Long id, Long usuarioId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Transacao t WHERE t.usuario.id = :usuarioId " +
           "AND t.tipoPagamento = :tipo " +
           "AND MONTH(t.data) = :mes AND YEAR(t.data) = :ano")
    void deleteByUsuarioAndTipoPagamentoAndMesAno(
            @Param("usuarioId") Long usuarioId,
            @Param("tipo") TipoPagamento tipo,
            @Param("mes") int mes,
            @Param("ano") int ano);
}
