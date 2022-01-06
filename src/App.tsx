import React, { useState, useCallback } from 'react'
import io from 'socket.io-client'
import range from 'lodash/range'
import chunk from 'lodash/chunk'
import './App.css'

const socket = io('http://localhost:8080')

type socketEventType = 'bid' | 'play_card'
type turnPhaseType = undefined | 'waiting' | 'bidding' | 'playing'

// eslint-disable-next-line
const player_id = 1

const directionDatas = ['North', 'East', 'South', 'West']
const bidSuiteDatas = ['Club', 'Diamond', 'Heart', 'Space', 'No Trump']

function App() {
  const [turnPhase, setTurnPhase] = useState<turnPhaseType>(undefined)
  const [direction, setDirection] = useState<number>(0)
  const [next, setNext] = useState<number | undefined>(undefined)
  const [turn, setTurn] = useState<number>(0)
  const [bidSuite, setBidSuite] = useState<number | undefined>(undefined)

  // socket.on('connect', () => {
  //   console.log(`socket.id`, socket.id)
  // })

  // socket.on('waiting_for_start', (players) => {
  //   console.log(`players`, players)
  // })

  socket.on('playing', ({ status, payload }) => {
    switch (status) {
      case 'initial_playing':
        setBidSuite(payload?.bidSuite)
        setTurn(payload?.turn)
        setTurnPhase('playing')
        setNext(payload?.leader)
        break
      case 'initial_turn':
        setTurn(payload?.turn)
        setTurnPhase('playing')
        setNext(payload?.leader)
        break
      case 'waiting_for_bid':
        setTurn(payload?.turn)
        setTurnPhase('bidding')
        setNext(payload?.nextDirection)
        /// display others contract here ...
        break
      default:
        setNext(payload?.nextDirection)
        break
    }
  })

  const joinGameRoom = () => {
    socket.emit('join', { player_id: 1, player_name: 'Boat', room: 'room_1' })
    setTurnPhase('waiting')
  }

  const onDirectionChange = ({ target }: { target: any }) => {
    setDirection(parseInt(target.value, 10))
  }

  const emit = useCallback(
    ({ event, payload }: { event: socketEventType; payload: any }) => {
      if (direction === next) {
        // eslint-disable-next-line
        socket.emit(event, { player_id, ...payload })
      }
    },
    [direction, next]
  )

  const bid = (contract: number) => {
    emit({
      event: 'bid',
      payload: {
        contract,
        direction,
        room: 'room_1',
      },
    })
  }

  const playCard = (card: number) => {
    emit({
      event: 'play_card',
      payload: {
        card,
        turn,
        direction,
        room: 'room_1',
      },
    })
  }

  return (
    <div className="App">
      <div onChange={onDirectionChange}>
        <div>
          <input type="radio" name="direction" value={0} />
          <span>North</span>
        </div>
        <div>
          <input type="radio" name="direction" value={1} />
          <span>East</span>
        </div>
        <div>
          <input type="radio" name="direction" value={2} />
          <span>South</span>
        </div>
        <div>
          <input type="radio" name="direction" value={3} />
          <span>West</span>
        </div>
      </div>
      <button onClick={joinGameRoom} type="button">
        JOIN
      </button>
      {turnPhase === 'waiting' && <div>waiting ...</div>}
      {turnPhase === 'bidding' && (
        <div className="bidding-board">
          {chunk(range(0, 35), 5).map((chunkedContract) => (
            <div>
              {chunkedContract.map((contract) => (
                // eslint-disable-next-line
                <span onClick={() => bid(contract)} role="application">
                  {contract}{' '}
                </span>
              ))}
            </div>
          ))}
          {/* eslint-disable-next-line */}
          <span onClick={() => bid(-1)} role="application">
            pass
          </span>
        </div>
      )}
      {turnPhase === 'playing' && (
        <>
          {chunk(range(0, 52), 13).map((chunkedCard) => (
            <div className="handle-cards-list">
              {chunkedCard.map((card) => (
                // eslint-disable-next-line
                <span onClick={() => playCard(card)} role="application">
                  {card}{' '}
                </span>
              ))}
            </div>
          ))}
          <div>
            {bidSuite !== undefined && (
              <div>bid suite: {bidSuiteDatas[bidSuite]}</div>
            )}
          </div>
        </>
      )}
      {turnPhase &&
        next !== undefined &&
        ['bidding', 'playing'].includes(turnPhase) && (
          <div>next: {next === direction ? 'you' : directionDatas[next]}</div>
        )}
    </div>
  )
}

export default App
