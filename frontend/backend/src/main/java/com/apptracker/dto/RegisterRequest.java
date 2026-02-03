package com.apptracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.*;

public class RegisterRequest {

    @NotBlank
    @NotNull(message = "Please provide a name")
    private String name;
    @Email
    @NotNull(message = "Please provide an email")
    private String email;
    @NotBlank
    @NotNull(message = "Please provide a password")
    private String password;

    // Getters and Setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

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
