package za.co.infratech.rispo.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.infratech.rispo.model.TournamentTemplate;
import za.co.infratech.rispo.service.TournamentTemplateService;

import java.util.List;

@RestController
@RequestMapping("/api/admin/tournament-templates")
@RequiredArgsConstructor
public class TournamentTemplateController {
    
    private final TournamentTemplateService templateService;
    
    @GetMapping
    public ResponseEntity<List<TournamentTemplate>> getAllTemplates() {
        return ResponseEntity.ok(templateService.getAllActiveTemplates());
    }
    
    @GetMapping("/{templateId}")
    public ResponseEntity<TournamentTemplate> getTemplateById(@PathVariable Long templateId) {
        return ResponseEntity.ok(templateService.getTemplateById(templateId));
    }
    
    @GetMapping("/type/{tournamentType}")
    public ResponseEntity<List<TournamentTemplate>> getTemplatesByType(@PathVariable String tournamentType) {
        return ResponseEntity.ok(templateService.getTemplatesByType(tournamentType));
    }
    
    @PostMapping
    public ResponseEntity<TournamentTemplate> createTemplate(@RequestBody TournamentTemplate template) {
        return ResponseEntity.ok(templateService.createTemplate(template));
    }
    
    @PutMapping("/{templateId}")
    public ResponseEntity<TournamentTemplate> updateTemplate(
            @PathVariable Long templateId, 
            @RequestBody TournamentTemplate template) {
        return ResponseEntity.ok(templateService.updateTemplate(templateId, template));
    }
    
    @DeleteMapping("/{templateId}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Long templateId) {
        templateService.deleteTemplate(templateId);
        return ResponseEntity.ok().build();
    }
    
    @PatchMapping("/{templateId}/deactivate")
    public ResponseEntity<Void> deactivateTemplate(@PathVariable Long templateId) {
        templateService.deactivateTemplate(templateId);
        return ResponseEntity.ok().build();
    }
}
