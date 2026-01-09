package za.co.infratech.rispo;

import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableRabbit
public class RispoApplication {

	public static void main(String[] args) {
		SpringApplication.run(RispoApplication.class, args);
	}

}
