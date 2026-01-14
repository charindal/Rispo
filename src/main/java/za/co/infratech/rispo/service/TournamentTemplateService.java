package za.co.infratech.rispo.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.co.infratech.rispo.model.TournamentTemplate;
import za.co.infratech.rispo.repository.TournamentTemplateRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TournamentTemplateService {
    
    private final TournamentTemplateRepository templateRepository;
    
    @Transactional(readOnly = true)
    public List<TournamentTemplate> getAllActiveTemplates() {
        return templateRepository.findByIsActiveTrueOrderByCreatedAtDesc();
    }
    
    @Transactional(readOnly = true)
    public List<TournamentTemplate> getTemplatesByType(String tournamentType) {
        return templateRepository.findByTournamentType(tournamentType);
    }
    
    @Transactional(readOnly = true)
    public TournamentTemplate getTemplateById(Long templateId) {
        return templateRepository.findById(templateId)
                .orElseThrow(() -> new RuntimeException("Template not found with id: " + templateId));
    }
    
    @Transactional
    public TournamentTemplate createTemplate(TournamentTemplate template) {
        log.info("Creating new tournament template: {}", template.getTemplateName());
        return templateRepository.save(template);
    }
    
    @Transactional
    public TournamentTemplate updateTemplate(Long templateId, TournamentTemplate updatedTemplate) {
        TournamentTemplate existing = getTemplateById(templateId);
        
        existing.setTemplateName(updatedTemplate.getTemplateName());
        existing.setDescription(updatedTemplate.getDescription());
        existing.setTournamentType(updatedTemplate.getTournamentType());
        existing.setMinPlayers(updatedTemplate.getMinPlayers());
        existing.setMaxPlayers(updatedTemplate.getMaxPlayers());
        existing.setNumberOfRounds(updatedTemplate.getNumberOfRounds());
        existing.setScoringSystem(updatedTemplate.getScoringSystem());
        existing.setTimeControl(updatedTemplate.getTimeControl());
        existing.setRules(updatedTemplate.getRules());
        existing.setPointsForWin(updatedTemplate.getPointsForWin());
        existing.setPointsForDraw(updatedTemplate.getPointsForDraw());
        existing.setPointsForLoss(updatedTemplate.getPointsForLoss());
        existing.setAllowTieBreaks(updatedTemplate.getAllowTieBreaks());
        existing.setTieBreakMethod(updatedTemplate.getTieBreakMethod());
        
        log.info("Updated tournament template: {}", templateId);
        return templateRepository.save(existing);
    }
    
    @Transactional
    public void deactivateTemplate(Long templateId) {
        TournamentTemplate template = getTemplateById(templateId);
        template.setIsActive(false);
        templateRepository.save(template);
        log.info("Deactivated tournament template: {}", templateId);
    }
    
    @Transactional
    public void deleteTemplate(Long templateId) {
        templateRepository.deleteById(templateId);
        log.info("Deleted tournament template: {}", templateId);
    }
}
