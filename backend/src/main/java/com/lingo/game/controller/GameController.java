package com.lingo.game.controller;

import com.lingo.game.dto.ClientGameRoom;
import com.lingo.game.dto.GuessResult;
import com.lingo.game.dto.JoinRoomRequest;
import com.lingo.game.dto.SubmitGuessRequest;
import com.lingo.game.model.GameRoom;
import com.lingo.game.service.GameService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GameController {

    private final GameService gameService;
    private final SimpMessagingTemplate messagingTemplate;

    public GameController(GameService gameService, SimpMessagingTemplate messagingTemplate) {
        this.gameService = gameService;
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping("/api/room/create")
    public ClientGameRoom createRoom() {
        GameRoom room = gameService.createRoom();
        return gameService.mapToClientRoom(room);
    }

    @MessageMapping("/room.join")
    public void joinRoom(@Payload JoinRoomRequest request, SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        GameRoom room = gameService.joinRoom(request.getRoomId(), request.getPlayerName(), sessionId);
        
        if (room != null) {
            ClientGameRoom clientRoom = gameService.mapToClientRoom(room);
            messagingTemplate.convertAndSend("/topic/room/" + room.getRoomId(), clientRoom);
        }
    }

    @MessageMapping("/room.guess")
    public void submitGuess(@Payload SubmitGuessRequest request) {
        GuessResult result = gameService.processGuess(request.getRoomId(), request.getGuess());
        
        if (result != null) {
            // Broadcast the guess result
            messagingTemplate.convertAndSend("/topic/room/" + request.getRoomId() + "/guess", result);
            
            GameRoom room = gameService.getRoom(request.getRoomId());
            if (room != null) {
                // Broadcast the updated room state (includes updated scores, active team, steal state)
                ClientGameRoom clientRoom = gameService.mapToClientRoom(room, result.getViolationReason());
                messagingTemplate.convertAndSend("/topic/room/" + room.getRoomId(), clientRoom);
            }
        }
    }

    @MessageMapping("/room.nextTurn")
    public void nextTurn(@Payload JoinRoomRequest request) {
        GameRoom room = gameService.getRoom(request.getRoomId());
        if (room != null) {
            // Alternate active team for the next word
            String nextTeam = room.getOpposingTeamId();
            room.setActiveTeamId(nextTeam);
            
            gameService.startNewTurn(room, 5);
            ClientGameRoom clientRoom = gameService.mapToClientRoom(room);
            messagingTemplate.convertAndSend("/topic/room/" + room.getRoomId(), clientRoom);
        }
    }
}
