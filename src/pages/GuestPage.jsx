import { useState } from 'react'
import JoinScreen from '../components/guest/JoinScreen'
import GameScreen from '../components/guest/GameScreen'
import ThankYouScreen from '../components/guest/ThankYouScreen'

export default function GuestPage() {
  // player: { id, full_name, event_id, assigned_questions, answers, finished }
  const [player, setPlayer] = useState(null)
  const [questions, setQuestions] = useState([]) // objetos completos de questions
  const [finished, setFinished] = useState(false)

  if (finished) {
    return <ThankYouScreen />
  }

  if (!player) {
    return (
      <JoinScreen
        onJoined={(playerData, questionsData) => {
          setPlayer(playerData)
          setQuestions(questionsData)
          if (playerData.finished) setFinished(true)
        }}
      />
    )
  }

  return (
    <GameScreen
      player={player}
      questions={questions}
      onFinished={() => setFinished(true)}
    />
  )
}
