package com.aditya.gymtracker.entity;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class User {

    private Long id;
    private String name;
    private Instant createdAt;
}
