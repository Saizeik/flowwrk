package com.apptracker.repository;

import com.apptracker.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);

    List<User> findByEmailVerifiedFalseAndCreatedAtBefore(OffsetDateTime cutoffDateTime);
}
