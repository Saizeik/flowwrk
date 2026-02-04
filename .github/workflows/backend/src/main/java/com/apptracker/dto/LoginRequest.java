package com.apptracker.dto;

import jakarta.validation.constraints.*;

public class LoginRequest {
    @Email
    @NotNull(message = "Please provide an email")
    private String email;
    @NotBlank
    @NotNull(message = "Please provide a password")
    private String password;

    // Getters and Setters
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
