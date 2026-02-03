package com.apptracker.dto;

import com.apptracker.model.ApplicationEntity;
import java.time.OffsetDateTime;
import java.util.UUID;

public class ApplicationDTO {
    private UUID id;
    private String company;
    private String role;
    private String location;
    private String status;
    private OffsetDateTime dateApplied;
    private String jobUrl;
    private String priority;
    private boolean archived;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public ApplicationDTO() {
    }

    public ApplicationDTO(ApplicationEntity entity) {
        this.id = entity.getId();
        this.company = entity.getCompany();
        this.role = entity.getRole();
        this.location = entity.getLocation();
        this.status = entity.getStatus().name();
        this.dateApplied = entity.getDateApplied();
        this.jobUrl = entity.getJobUrl();
        this.priority = entity.getPriority().name();
        this.archived = entity.isArchived();
        this.createdAt = entity.getCreatedAt();
        this.updatedAt = entity.getUpdatedAt();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public OffsetDateTime getDateApplied() {
        return dateApplied;
    }

    public void setDateApplied(OffsetDateTime dateApplied) {
        this.dateApplied = dateApplied;
    }

    public String getJobUrl() {
        return jobUrl;
    }

    public void setJobUrl(String jobUrl) {
        this.jobUrl = jobUrl;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public boolean isArchived() {
        return archived;
    }

    public void setArchived(boolean archived) {
        this.archived = archived;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
