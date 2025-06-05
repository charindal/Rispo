package za.co.infratech.rispo.util;

import za.co.infratech.rispo.dto.enums.MatchResult;

import java.util.HashMap;
import java.util.Map;

public class RatingCalculator {

    private static final int BASE_RATING_CHANGE = 16;

    public static Map<String, Integer> calculate(int rating1, int rating2, MatchResult result) {
        int change1 = 0;
        int change2 = 0;

        switch (result) {
            case DRAW:
                int ratingDifference = Math.abs(rating1 - rating2);
                int adjustment = Math.min(BASE_RATING_CHANGE, ratingDifference / 32 + 1);

                if (rating1 < rating2) {
                    change1 = adjustment;
                    change2 = -adjustment;
                } else if (rating1 > rating2) {
                    change1 = -adjustment;
                    change2 = adjustment;
                }
                break;

            case PLAYER1_WIN:
            case PLAYER2_WIN:
                boolean player1Won = result == MatchResult.PLAYER1_WIN;

                double expectedScore1 = 1.0 / (1 + Math.pow(10, (rating2 - rating1) / 400.0));
                double expectedScore2 = 1.0 / (1 + Math.pow(10, (rating1 - rating2) / 400.0));

                change1 = (int) Math.round(BASE_RATING_CHANGE * ((player1Won ? 1 : 0) - expectedScore1));
                change2 = (int) Math.round(BASE_RATING_CHANGE * ((player1Won ? 0 : 1) - expectedScore2));
                break;
        }

        Map<String, Integer> resultMap = new HashMap<>();
        resultMap.put("player1", change1);
        resultMap.put("player2", change2);
        return resultMap;
    }
}
