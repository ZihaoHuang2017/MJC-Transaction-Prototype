/*
 * Please read the specs below for the functionality that the prototype should support.
 */

export enum WIND {
	EAST,
	SOUTH,
}

export enum actionType {
	RON, // a rons b
	TSUMO, // a tsumos
	CHOMBO, // a chombos
	TENPAI, // a pays tenpai money to b
	DEAL_IN_PAO, // a deals in b while being pao
	SELF_DRAW_PAO, // b self-draw; a was pao
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
	actionType: actionType;
	subject: string; // the one who performs the action
	object?: string; // the one who endures the action
	hand?: Hand;
	scoreDeltas: number[]; // the overall score changes as a result of this action. Have length 4
}

const MANGAN_BASE_POINT = 2000;

const manganValue = (points: number) => {
	let multiplier = 0;
	switch (true) {
		case points === 5:
			multiplier = 1;
			break;
		case points <= 7:
			multiplier = 1.5;
			break;
		case points <= 10:
			multiplier = 2;
			break;
		case points <= 12:
			multiplier = 3;
			break;
		// After 13 points is hit, we only see multiples of 13
		case points === 13:
			multiplier = 4;
			break;
		case points === 26:
			multiplier = 4 * 2;
			break;
		case points === 39:
			multiplier = 4 * 3;
			break;
		case points === 52:
			multiplier = 4 * 4;
			break;
		case points === 65:
			multiplier = 4 * 5;
			break;
	}
	return MANGAN_BASE_POINT * multiplier;
};

function calculateHandValue(multiplier: number, fu: number, han: number, honba: number, pointPerHonba: number) {
	if (han >= 5) {
		return manganValue(han) * multiplier;
	}
	const manganPayout = MANGAN_BASE_POINT * multiplier;
	const handValue = Math.ceil((fu * Math.pow(2, 2 + han) * multiplier) / 100) * 100;
	return handValue > manganPayout ? manganPayout + honba * pointPerHonba : handValue + honba * pointPerHonba;
}

export class JapaneseRound {
	public readonly globalSeating: Person[]; // the dealer is on the round - 1 index
	public readonly wind: WIND;
	public readonly round: number;
	public readonly honba: number;
	public readonly riichiSticks: number;
	private actions: Transaction[];
	public readonly localSeating: any;

	constructor(globalSeating: Person[], wind: WIND, round: number, honba: number, riichiSticks: number) {
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
		this.initializeLocalSeating();
	}

	private initializeLocalSeating() {
		const names = [];

		for (const person of this.globalSeating) {
			names.push(person.playerName);
		}
		const dealer = this.globalSeating[this.round - 1];

		while (names[0] !== dealer.playerName) {
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
		if (this.getPlayerLocalIndex(person) === 0) {
			return 6;
		}
		return 4;
	}

	public getTsumoMultiplier(person: string, isDealer: boolean) {
		if (isDealer || this.getPlayerLocalIndex(person) == 0) {
			return 2;
		}
		return 1;
	}

	public addRon(winner: string, loser: string, hand: Hand) {
		const scoreDeltas = [0, 0, 0, 0];
		scoreDeltas[this.getPlayerGlobalIndex(winner)] = calculateHandValue(
			this.getDealinMultiplier(winner),
			hand.fu,
			hand.han,
			hand.honba,
			300
		);
		scoreDeltas[this.getPlayerGlobalIndex(loser)] = -calculateHandValue(
			this.getDealinMultiplier(winner),
			hand.fu,
			hand.han,
			hand.honba,
			300
		);

		this.actions.push({
			actionType: actionType.RON,
			subject: winner,
			object: loser,
			hand: hand,
			scoreDeltas: scoreDeltas,
		});
		return scoreDeltas;
	}

	public addTsumo(winner: string, hand: Hand) {
		const scoreDeltas = [0, 0, 0, 0];
		const isDealer = this.getPlayerLocalIndex(winner) === 0;
		let totalScore = 0;
		for (const playerName in this.localSeating) {
			if (playerName !== winner) {
				const value = calculateHandValue(
					this.getTsumoMultiplier(playerName, isDealer),
					hand.fu,
					hand.han,
					hand.honba,
					100
				);
				totalScore += value;
				scoreDeltas[this.getPlayerGlobalIndex(playerName)] = -value;
			}
		}
		scoreDeltas[this.getPlayerGlobalIndex(winner)] = totalScore;
		this.actions.push({
			actionType: actionType.TSUMO,
			subject: winner,
			hand: hand,
			scoreDeltas: scoreDeltas,
		});
		return scoreDeltas;
	}

	public calculate(): void {
		/**
		 * Returns the situation of the next round in accordance to the actions performed.
		 * Should go through
		 */
		return;
	}
}
