package com.apptracker.dto;

import java.time.OffsetDateTime;

public class CreateReminderRequest {
    private OffsetDateTime remindAt;
    private String message;

    // Getters and Setters
    public OffsetDateTime getRemindAt() {
        return remindAt;
    }

    public void setRemindAt(OffsetDateTime remindAt) {
        this.remindAt = remindAt;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
