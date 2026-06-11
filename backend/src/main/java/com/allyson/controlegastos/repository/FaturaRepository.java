package com.allyson.controlegastos.repository;

import com.allyson.controlegastos.model.Fatura;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FaturaRepository extends JpaRepository<Fatura, Long> {
    Optional<Fatura> findByUsuarioIdAndMesAndAno(Long usuarioId, int mes, int ano);
    List<Fatura> findByUsuarioIdOrderByAnoDescMesDesc(Long usuarioId);
    Optional<Fatura> findByIdAndUsuarioId(Long id, Long usuarioId);
}
