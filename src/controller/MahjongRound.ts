/*
 * Please read the specs below for the functionality that the prototype should support.
 */

import {calculateHandValue, MANGAN_BASE_POINT} from "./Points";

export enum Wind {
	EAST,
	SOUTH,
}

export enum ActionType {
	RON,
	TSUMO,
	CHOMBO,
	TENPAI,
	DEAL_IN_PAO,
	SELF_DRAW_PAO,
	NAGASHI_MANGAN,
}

export interface Person {
	playerName: string;
	score: number;
}

export interface Hand {
	fu: number;
	han: number;
	honba: number;
}

export interface Transaction {
	actionType: ActionType;
	pointReceiver: string;
	pointGiver: string;
	hand?: Hand;
	amount: number;
}

export class JapaneseRound {
	public readonly globalSeating: Person[]; // the dealer is on the round - 1 index
	public readonly wind: Wind;
	public readonly round: number;
	public readonly honba: number;
	public riichiSticks: number;
	public readonly actions: Transaction[];
	public readonly localSeating: any;
	private readonly dealerName: string;

	constructor(globalSeating: Person[], wind: Wind, round: number, honba: number, riichiSticks: number) {
		/**
		 * Represents a Round in a Riichi Game.
		 * @param seating a list representing the *initial* seating and the points.
		 * That is, if round = 3, then seating[3-1] is the dealer.
		 * @param wind the wind of the current. Can be East or South.
		 * @param round the current round. Between 1 and 4.
		 * @param honba the current honba. Can either be 0 (different win), honba of past round + 1 (dealer tenpai/ron)
		 * or honba of past round (Reshuffle, Chombo).
		 * @param riichiSticks the amount of riichi Sticks that are still on the table.
		 *
		 * Invariant: the total number of riichi sticks * 1000 + the total score of each player should add up to 100000
		 **/
		this.globalSeating = globalSeating;
		this.wind = wind;
		this.round = round;
		this.honba = honba;
		this.riichiSticks = riichiSticks;
		this.actions = [];
		this.localSeating = {};
		this.dealerName = this.globalSeating[this.round - 1].playerName;
		this.initializeLocalSeating();
	}

	private initializeLocalSeating() {
		const names = [];

		for (const person of this.globalSeating) {
			names.push(person.playerName);
		}

		while (names[0] !== this.dealerName) {
			names.push(names.shift());
		}
		for (const i in names) {
			// @ts-ignore
			this.localSeating[names[i]] = parseInt(i, 10);
		}
	}

	public getPlayerLocalIndex(playerName: string): number {
		return this.localSeating[playerName];
	}

	public getPlayerGlobalIndex(playerName: string): number {
		return (this.localSeating[playerName] + this.round - 1) % 4;
	}

	public getDealinMultiplier(person: string) {
		if (person === this.dealerName) {
			return 6;
		}
		return 4;
	}

	public getTsumoMultiplier(person: string, isDealer: boolean) {
		if (isDealer || person === this.dealerName) {
			return 2;
		}
		return 1;
	}

	public addRon(winner: string, loser: string, hand: Hand) {
		const multiplier = this.getDealinMultiplier(winner);
		const handValue = calculateHandValue(multiplier, hand, 300);
		this.actions.push({
			actionType: ActionType.RON,
			pointReceiver: winner,
			pointGiver: loser,
			hand: hand,
			amount: handValue,
		});
	}

	public addTsumo(winner: string, hand: Hand) {
		const isDealer = this.getPlayerLocalIndex(winner) === 0;
		for (const playerName in this.localSeating) {
			if (playerName !== winner) {
				const value = calculateHandValue(this.getTsumoMultiplier(playerName, isDealer), hand, 100);
				this.actions.push({
					actionType: ActionType.RON,
					pointReceiver: winner,
					pointGiver: playerName,
					hand: hand,
					amount: value,
				});
			}
		}
	}

	public addChombo(chomboPlayer: string) {
		for (const playerName in this.localSeating) {
			if (playerName !== chomboPlayer) {
				this.actions.push({
					actionType: ActionType.CHOMBO,
					pointReceiver: playerName,
					pointGiver: chomboPlayer,
					amount: 2 * MANGAN_BASE_POINT,
				});
			}
		}
	}

	public addNagashiMangan(winner: string) {
		const isDealer = this.getPlayerLocalIndex(winner) === 0;
		for (const playerName in this.localSeating) {
			if (playerName !== winner) {
				const value = MANGAN_BASE_POINT * this.getTsumoMultiplier(playerName, isDealer);
				this.actions.push({
					actionType: ActionType.NAGASHI_MANGAN,
					pointReceiver: winner,
					pointGiver: playerName,
					amount: value,
				});
			}
		}
	}

	public addPaoDealIn(winner: string, dealInPerson: string, paoPerson: string, hand: Hand) {
		const multiplier = this.getDealinMultiplier(winner);
		this.actions.push({
			actionType: ActionType.NAGASHI_MANGAN,
			pointReceiver: winner,
			pointGiver: dealInPerson,
			amount: calculateHandValue(multiplier / 2, hand, 300),
		});
		this.actions.push({
			actionType: ActionType.NAGASHI_MANGAN,
			pointReceiver: winner,
			pointGiver: paoPerson,
			amount: calculateHandValue(multiplier / 2, hand, 0),
		});
	}

	public addPaoTsumo(winner: string, paoPerson: string, hand: Hand) {
		const multiplier = this.getDealinMultiplier(winner);
		const value = calculateHandValue(multiplier, hand, 300);
		this.actions.push({
			actionType: ActionType.SELF_DRAW_PAO,
			pointReceiver: winner,
			pointGiver: paoPerson,
			hand: hand,
			amount: value,
		});
	}
	public addRiichi(riichiPlayer: string) {
		this.riichiSticks += 1;
		this.globalSeating[this.getPlayerGlobalIndex(riichiPlayer)].score -= 1000;
	}
	public getScoreDeltas(): number[] {
		/**
		 * Returns the situation of the next round in accordance to the actions performed.
		 * Should go through the list of actions and aggregate a final score delta.
		 */
		let finalRoundChange = [0, 0, 0, 0];
		for (const transaction of this.actions) {
			finalRoundChange[this.getPlayerGlobalIndex(transaction.pointReceiver)] += transaction.amount;
			finalRoundChange[this.getPlayerGlobalIndex(transaction.pointGiver)] -= transaction.amount;
		}
		return finalRoundChange;
	}

	private getClosestWinner(loserLocalPos: number, winners: Set<string>) {
		let [closestWinner] = winners;
		for (const winnerName of winners) {
			if (
				(this.getPlayerLocalIndex(winnerName) - loserLocalPos) % 4 <
				(this.getPlayerLocalIndex(closestWinner) - loserLocalPos) % 4
			) {
				closestWinner = winnerName;
			}
		}
		return closestWinner;
	}

	public getNextRound(): JapaneseRound {
		for (const i in this.getScoreDeltas()) {
			this.globalSeating[i].score += this.getScoreDeltas()[i];
		}
		const {winners, losers} = this.getProminentPlayers();
		const renchan = this.modifyRenchan(winners, losers);
		if (renchan) {
			// TODO: Logic NOT correct
			return new JapaneseRound(this.globalSeating, this.wind, this.round, this.honba + 1, this.riichiSticks);
		} else {
			if (this.wind === Wind.EAST && this.round === 4) {
				return new JapaneseRound(this.globalSeating, Wind.SOUTH, 1, 0, this.riichiSticks);
			} else {
				return new JapaneseRound(this.globalSeating, this.wind, this.round + 1, 0, this.riichiSticks);
			}
		}
	}

	private modifyRenchan(winners: Set<string>, losers: Set<string>) {
		if (winners.size === 1) {
			const [winner] = winners;
			this.globalSeating[this.getPlayerGlobalIndex(winner)].score += this.riichiSticks * 1000;
			this.riichiSticks = 0;
			if (winner === this.dealerName) {
				return true;
			}
		} else if (losers.size === 1) {
			const [loser] = losers;
			const loserLocalPos = this.getPlayerLocalIndex(loser);
			const closestWinner = this.getClosestWinner(loserLocalPos, winners);
			this.globalSeating[this.getPlayerGlobalIndex(closestWinner)].score += this.riichiSticks * 1000;
			this.riichiSticks = 0;
			if (winners.has(this.dealerName)) {
				return true;
			}
		}
		return false;
	}

	private getProminentPlayers() {
		const winners = new Set<string>();
		const losers = new Set<string>();
		for (const transaction of this.actions) {
			if (
				[ActionType.RON, ActionType.TSUMO, ActionType.SELF_DRAW_PAO, ActionType.DEAL_IN_PAO].includes(
					transaction.actionType
				)
			) {
				winners.add(transaction.pointReceiver);
				losers.add(transaction.pointGiver);
			}
		}
		if (winners.size > 1 && losers.size > 1) {
			throw new Error("Input mismatch: must have only one winner or only one loser");
		}
		return {winners, losers};
	}
}
