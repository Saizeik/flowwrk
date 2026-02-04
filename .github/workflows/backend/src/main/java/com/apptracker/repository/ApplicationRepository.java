package com.apptracker.repository;

import com.apptracker.model.ApplicationEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface ApplicationRepository
        extends JpaRepository<ApplicationEntity, UUID>, JpaSpecificationExecutor<ApplicationEntity> {
    Page<ApplicationEntity> findByUserId(UUID userId, Pageable pageable);
}
