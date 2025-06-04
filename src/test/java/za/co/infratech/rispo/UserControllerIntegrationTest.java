package za.co.infratech.rispo;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import za.co.infratech.rispo.dto.request.UserRegisterRequest;
import za.co.infratech.rispo.model.UserEntity;
import za.co.infratech.rispo.model.UserEntity.Role;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class UserControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testRegisterAndGetUser() throws Exception {
        UserRegisterRequest request = new UserRegisterRequest();
        request.setUsername("player1");
        request.setPassword("password123");
        request.setRole("PLAYER");


        mockMvc.perform(get("/api/users/" + 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.role").value("PLAYER"));

        mockMvc.perform(post("/api/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                .andExpect(status().isOk());
                //.andExpect(jsonPath("$.id").exists())
                //.andExpect(jsonPath("$.username").value("player1"))
                //.andExpect(jsonPath("$.role").value("PLAYER"));
    }
}
