/*
 * Please read the specs below for the functionality that the prototype should support.
 */

import {calculateHandValue, MANGAN_BASE_POINT} from "./Points";
import {
	ActionType,
	BackendToFrontendRound,
	FrontendToBackendRound,
	Hand,
	NUM_PLAYERS,
	Transaction,
	Wind,
} from "./Types";

export class JapaneseRound {
	public readonly roundWind: Wind;
	public readonly roundNumber: 1 | 2 | 3 | 4;
	public readonly honba: number;
	public readonly riichiSticks: number;
	public riichis: number[];
	public readonly transactions: Transaction[];
	private readonly dealerIndex: number;

	constructor(newRound: BackendToFrontendRound) {
		/**
		 * Represents a Round in a Riichi Game.
		 * @param wind the wind of the current. Can be East or South.
		 * @param round the current round. Between 1 and 4.
		 * @param honba the current honba. Can either be 0 (different win), honba of past round + 1 (dealer tenpai/ron)
		 * or honba of past round (Reshuffle, Chombo).
		 * @param riichiSticks the amount of riichi Sticks that are still on the table.
		 *
		 * Invariant: the total number of riichi sticks * 1000 + the total score of each player should add up to 100000
		 **/
		this.roundWind = newRound.roundWind;
		this.roundNumber = newRound.roundNumber;
		this.honba = newRound.honba;
		this.riichiSticks = newRound.startingRiichiSticks;
		this.riichis = [];
		this.transactions = [];
		this.dealerIndex = this.roundNumber - 1;
	}

	public getDealinMultiplier(personIndex: number) {
		if (personIndex === this.dealerIndex) {
			return 6;
		}
		return 4;
	}

	public getTsumoMultiplier(personIndex: number, isDealer: boolean) {
		if (isDealer || personIndex === this.dealerIndex) {
			return 2;
		}
		return 1;
	}

	public addRon(winnerIndex: number, loserIndex: number, hand: Hand) {
		const scoreDeltas = [0, 0, 0, 0];
		const multiplier = this.getDealinMultiplier(winnerIndex);
		const handValue = calculateHandValue(multiplier, hand);
		scoreDeltas[winnerIndex] = handValue;
		scoreDeltas[loserIndex] = -handValue;
		this.transactions.push({
			actionType: ActionType.RON,
			hand: hand,
			scoreDeltas: scoreDeltas,
		});
	}

	public addTsumo(winnerIndex: number, hand: Hand) {
		const scoreDeltas = [0, 0, 0, 0];
		const isDealer = winnerIndex === this.dealerIndex;
		let totalScore = 0;
		for (let i = 0; i < NUM_PLAYERS; i++) {
			if (i !== winnerIndex) {
				const value = calculateHandValue(this.getTsumoMultiplier(i, isDealer), hand);
				totalScore += value;
				scoreDeltas[i] = -value;
			}
		}
		scoreDeltas[winnerIndex] = totalScore;
		this.transactions.push({
			actionType: ActionType.TSUMO,
			hand: hand,
			scoreDeltas: scoreDeltas,
		});
		return scoreDeltas;
	}

	public addChombo(chomboPlayerIndex: number) {
		const scoreDeltas = [0, 0, 0, 0];
		for (let i = 0; i < NUM_PLAYERS; i++) {
			if (i !== chomboPlayerIndex) {
				scoreDeltas[i] = 2 * MANGAN_BASE_POINT;
				scoreDeltas[chomboPlayerIndex] -= 2 * MANGAN_BASE_POINT;
			}
		}
		this.transactions.push({
			actionType: ActionType.CHOMBO,
			scoreDeltas: scoreDeltas,
		});
	}

	public addNagashiMangan(winnerIndex: number) {
		const scoreDeltas = [0, 0, 0, 0];
		const isDealer = winnerIndex === this.dealerIndex;
		for (let i = 0; i < NUM_PLAYERS; i++) {
			if (i !== winnerIndex) {
				const value = MANGAN_BASE_POINT * this.getTsumoMultiplier(i, isDealer);
				scoreDeltas[i] = -value;
				scoreDeltas[winnerIndex] += value;
			}
		}
		this.transactions.push({
			actionType: ActionType.NAGASHI_MANGAN,
			scoreDeltas: scoreDeltas,
		});
	}

	public addPaoDealIn(winnerIndex: number, dealInPersonIndex: number, paoPersonIndex: number, hand: Hand) {
		const scoreDeltas = [0, 0, 0, 0];
		const multiplier = this.getDealinMultiplier(winnerIndex);
		scoreDeltas[dealInPersonIndex] = -calculateHandValue(multiplier / 2, hand);
		scoreDeltas[paoPersonIndex] = -calculateHandValue(multiplier / 2, hand);
		scoreDeltas[winnerIndex] += calculateHandValue(multiplier, hand);
		this.transactions.push({
			actionType: ActionType.NAGASHI_MANGAN,
			hand: hand,
			scoreDeltas: scoreDeltas,
		});
	}

	public addPaoTsumo(winnerIndex: number, paoPersonIndex: number, hand: Hand) {
		const scoreDeltas = [0, 0, 0, 0];
		const multiplier = this.getDealinMultiplier(winnerIndex);
		const value = calculateHandValue(multiplier, hand);
		scoreDeltas[paoPersonIndex] = -value;
		scoreDeltas[winnerIndex] += value;
		this.transactions.push({
			actionType: ActionType.NAGASHI_MANGAN,
			hand: hand,
			scoreDeltas: scoreDeltas,
		});
	}
	public addRiichi(riichiPlayerIndex: number) {
		this.riichis.push(riichiPlayerIndex);
	}

	private getFinalRiichiSticks() {
		for (const transaction of this.transactions) {
			if (
				[ActionType.RON, ActionType.TSUMO, ActionType.SELF_DRAW_PAO, ActionType.DEAL_IN_PAO].includes(
					transaction.actionType
				)
			) {
				return 0;
			}
		}
		return this.riichiSticks + this.riichis.length;
	}
	public concludeGame(): FrontendToBackendRound {
		return {
			roundWind: this.roundWind,
			roundNumber: this.roundNumber,
			honba: this.honba,
			startingRiichiSticks: this.riichiSticks,
			riichis: this.riichis,
			endingRiichiSticks: this.getFinalRiichiSticks(),
			transactions: this.transactions,
		};
	}
}

function addScoreDeltas(scoreDelta1: number[], scoreDelta2: number[]): number[] {
	const finalScoreDelta = [0, 0, 0, 0];
	for (const i in finalScoreDelta) {
		finalScoreDelta[i] += scoreDelta1[i] + scoreDelta2[i];
	}
	return finalScoreDelta;
}

function reduceScoreDeltas(transactions: Transaction[]): number[] {
	return transactions.reduce<number[]>(
		(result, current) => addScoreDeltas(result, current.scoreDeltas),
		[0, 0, 0, 0]
	);
}


function getClosestWinner(loserLocalPos: number, winners: Set<number>) {
	let [closestWinnerIndex] = winners;
	for (const winnerIndex of winners) {
		if ((winnerIndex - loserLocalPos) % 4 < (closestWinnerIndex - loserLocalPos) % 4) {
			closestWinnerIndex = winnerIndex;
		}
	}
	return closestWinnerIndex;
}

function dealershipRetains(transactions: Transaction[], dealerIndex: number) {
	for (const transaction of transactions) {
		if (
			[ActionType.RON, ActionType.TSUMO, ActionType.SELF_DRAW_PAO, ActionType.DEAL_IN_PAO].includes(
				transaction.actionType
			) &&
			transaction.scoreDeltas[dealerIndex] > 0
		) {
			return true;
		}
		if (transaction.actionType === ActionType.CHOMBO) {
			return true;
		}
		if (transaction.actionType === ActionType.NAGASHI_MANGAN) {
			return true;
		}
	}
	return false;
}

function getNewHonbaCount(dealerIndex: number, transactions: Transaction[], honba: number) {
	for (const transaction of transactions) {
		if (
			[ActionType.RON, ActionType.TSUMO, ActionType.SELF_DRAW_PAO, ActionType.DEAL_IN_PAO].includes(
				transaction.actionType
			) &&
			transaction.scoreDeltas[dealerIndex] > 0
		) {
			return honba + 1;
		}
		if (transaction.actionType === ActionType.CHOMBO) {
			return honba;
		}
	}
	return 0;
}

function getProminentPlayers(transactions: Transaction[]) {
	const winners = new Set<string>();
	const losers = new Set<string>();
	for (const transaction of transactions) {
		if (
			[ActionType.RON, ActionType.TSUMO, ActionType.SELF_DRAW_PAO, ActionType.DEAL_IN_PAO].includes(
				transaction.actionType
			)
		) {
			for (const index in transaction.scoreDeltas) {
				if (transaction.scoreDeltas[index] < 0) {
					losers.add(index);
				} else if (transaction.scoreDeltas[index] > 0) {
					winners.add(index);
				}
			}
		}
	}
	return {winners, losers};
}
