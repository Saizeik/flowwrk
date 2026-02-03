package com.apptracker.service;

import com.apptracker.model.Activity;
import com.apptracker.repository.ActivityRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final ApplicationService applicationService;

    public ActivityService(ActivityRepository activityRepository, ApplicationService applicationService) {
        this.activityRepository = activityRepository;
        this.applicationService = applicationService;
    }

    public List<Activity> getActivity(UUID userId, UUID appId) {
        // Verify ownership
        applicationService.getApplicationEntityById(userId, appId);
        return activityRepository.findByApplicationIdOrderByCreatedAtDesc(appId);
    }
}
