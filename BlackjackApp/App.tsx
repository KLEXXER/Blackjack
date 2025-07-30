import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';

// Card types
type Suit = '♠' | '♥' | '♦' | '♣';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
}

// Game state type
interface GameState {
  deck: Card[];
  playerHand: Card[];
  dealerHand: Card[];
  playerScore: number;
  dealerScore: number;
  gameStatus: 'playing' | 'playerWins' | 'dealerWins' | 'tie' | 'playerBust' | 'dealerBust';
  gameStarted: boolean;
  dealerTurn: boolean;
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    deck: [],
    playerHand: [],
    dealerHand: [],
    playerScore: 0,
    dealerScore: 0,
    gameStatus: 'playing',
    gameStarted: false,
    dealerTurn: false,
  });

  // Create a standard deck of cards
  const createDeck = (): Card[] => {
    const suits: Suit[] = ['♠', '♥', '♦', '♣'];
    const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck: Card[] = [];

    suits.forEach(suit => {
      ranks.forEach(rank => {
        let value = 0;
        if (rank === 'A') value = 11; // Ace starts as 11
        else if (['J', 'Q', 'K'].includes(rank)) value = 10;
        else value = parseInt(rank);

        deck.push({ suit, rank, value });
      });
    });

    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
  };

  // Calculate hand value with proper Ace handling
  const calculateHandValue = (hand: Card[]): number => {
    let value = 0;
    let aces = 0;

    hand.forEach(card => {
      if (card.rank === 'A') {
        aces++;
        value += 11;
      } else {
        value += card.value;
      }
    });

    // Convert Aces from 11 to 1 if needed
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }

    return value;
  };

  // Start a new game
  const startNewGame = () => {
    const newDeck = createDeck();
    const playerHand = [newDeck.pop()!, newDeck.pop()!];
    const dealerHand = [newDeck.pop()!];

    setGameState({
      deck: newDeck,
      playerHand,
      dealerHand,
      playerScore: calculateHandValue(playerHand),
      dealerScore: calculateHandValue(dealerHand),
      gameStatus: 'playing',
      gameStarted: true,
      dealerTurn: false,
    });
  };

  // Player hits (takes another card)
  const hit = () => {
    if (gameState.gameStatus !== 'playing' || gameState.dealerTurn) return;

    const newDeck = [...gameState.deck];
    const newCard = newDeck.pop()!;
    const newPlayerHand = [...gameState.playerHand, newCard];
    const newPlayerScore = calculateHandValue(newPlayerHand);

    let newGameStatus = gameState.gameStatus;
    if (newPlayerScore > 21) {
      newGameStatus = 'playerBust';
    }

    setGameState({
      ...gameState,
      deck: newDeck,
      playerHand: newPlayerHand,
      playerScore: newPlayerScore,
      gameStatus: newGameStatus,
    });
  };

  // Player stands (dealer's turn)
  const stand = () => {
    if (gameState.gameStatus !== 'playing' || gameState.dealerTurn) return;

    setGameState({
      ...gameState,
      dealerTurn: true,
    });
  };

  // Dealer plays automatically
  useEffect(() => {
    if (!gameState.dealerTurn || gameState.gameStatus !== 'playing') return;

    const dealerPlay = () => {
      const newDeck = [...gameState.deck];
      let newDealerHand = [...gameState.dealerHand];
      let newDealerScore = calculateHandValue(newDealerHand);

      // Dealer hits on 16 and below, stands on 17 and above
      while (newDealerScore < 17) {
        const newCard = newDeck.pop()!;
        newDealerHand.push(newCard);
        newDealerScore = calculateHandValue(newDealerHand);
      }

      // Determine winner
      let newGameStatus: GameState['gameStatus'];
      if (newDealerScore > 21) {
        newGameStatus = 'dealerBust';
      } else if (newDealerScore > gameState.playerScore) {
        newGameStatus = 'dealerWins';
      } else if (newDealerScore < gameState.playerScore) {
        newGameStatus = 'playerWins';
      } else {
        newGameStatus = 'tie';
      }

      setGameState({
        ...gameState,
        deck: newDeck,
        dealerHand: newDealerHand,
        dealerScore: newDealerScore,
        gameStatus: newGameStatus,
        dealerTurn: false,
      });
    };

    const timer = setTimeout(dealerPlay, 1000);
    return () => clearTimeout(timer);
  }, [gameState.dealerTurn]);

  // Render a card
  const renderCard = (card: Card, hidden = false) => {
    if (hidden) {
      return (
        <View style={[styles.card, styles.hiddenCard]}>
          <Text style={styles.cardText}>?</Text>
        </View>
      );
    }

    const isRed = card.suit === '♥' || card.suit === '♦';
    return (
      <View style={styles.card}>
        <Text style={[styles.cardText, isRed && styles.redCard]}>
          {card.rank}{card.suit}
        </Text>
      </View>
    );
  };

  // Get game status message
  const getStatusMessage = () => {
    switch (gameState.gameStatus) {
      case 'playerWins':
        return '🎉 Du gewinnst!';
      case 'dealerWins':
        return '😔 Dealer gewinnt!';
      case 'tie':
        return '🤝 Unentschieden!';
      case 'playerBust':
        return '💥 Überkauft! Dealer gewinnt!';
      case 'dealerBust':
        return '🎉 Dealer überkauft! Du gewinnst!';
      default:
        return gameState.dealerTurn ? '🤖 Dealer ist dran...' : '🎮 Dein Zug!';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f4c3a" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>🃏 Blackjack</Text>
        
        {!gameState.gameStarted ? (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Willkommen beim Blackjack!</Text>
            <Text style={styles.rulesText}>
              Ziel: Komme so nah wie möglich an 21, ohne zu überschreiten.
            </Text>
            <TouchableOpacity style={styles.startButton} onPress={startNewGame}>
              <Text style={styles.buttonText}>Neues Spiel starten</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Dealer Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dealer ({gameState.dealerScore})</Text>
              <View style={styles.hand}>
                {gameState.dealerHand.map((card, index) => (
                  <View key={index} style={styles.cardContainer}>
                    {renderCard(card)}
                  </View>
                ))}
                {!gameState.dealerTurn && gameState.gameStatus === 'playing' && (
                  <View style={styles.cardContainer}>
                    {renderCard({ suit: '♠', rank: 'A', value: 0 }, true)}
                  </View>
                )}
              </View>
            </View>

            {/* Player Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Du ({gameState.playerScore})</Text>
              <View style={styles.hand}>
                {gameState.playerHand.map((card, index) => (
                  <View key={index} style={styles.cardContainer}>
                    {renderCard(card)}
                  </View>
                ))}
              </View>
            </View>

            {/* Status */}
            <Text style={styles.statusText}>{getStatusMessage()}</Text>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              {gameState.gameStatus === 'playing' && !gameState.dealerTurn && (
                <>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.hitButton]} 
                    onPress={hit}
                  >
                    <Text style={styles.buttonText}>Karte ziehen</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.standButton]} 
                    onPress={stand}
                  >
                    <Text style={styles.buttonText}>Stehen bleiben</Text>
                  </TouchableOpacity>
                </>
              )}
              
              {gameState.gameStatus !== 'playing' && !gameState.dealerTurn && (
                <TouchableOpacity style={styles.startButton} onPress={startNewGame}>
                  <Text style={styles.buttonText}>Neues Spiel</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f4c3a',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 30,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  rulesText: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 40,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
    textAlign: 'center',
  },
  hand: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  cardContainer: {
    margin: 5,
  },
  card: {
    width: 60,
    height: 80,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  hiddenCard: {
    backgroundColor: '#8b4513',
  },
  cardText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  redCard: {
    color: '#dc143c',
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    margin: 10,
    minWidth: 120,
  },
  hitButton: {
    backgroundColor: '#e74c3c',
  },
  standButton: {
    backgroundColor: '#3498db',
  },
  startButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    margin: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default App;
