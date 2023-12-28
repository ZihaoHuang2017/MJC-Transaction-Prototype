export enum Wind {
	EAST,
	SOUTH,
	WEST,
	NORTH,
}

const windOrder = [Wind.EAST, Wind.SOUTH, Wind.WEST, Wind.NORTH];
export const getNextWind = (index: number): Wind => {
	return windOrder[(index % 4) + 1];
};

export const NUM_PLAYERS = 4;

export enum ActionType {
	RON,
	TSUMO,
	CHOMBO,
	TENPAI,
	DEAL_IN_PAO,
	SELF_DRAW_PAO,
	NAGASHI_MANGAN,
}
export interface Hand {
	fu: number;
	han: number;
}

export interface Transaction {
	actionType: ActionType;
	hand?: Hand;
	paoTarget?: number;
	scoreDeltas: number[];
}

export interface FrontendToBackendRound {
	/**
	 * The frontend sends the backend this after the transaction.
	 * @param roundWind The wind of the completed round.
	 * @param roundNumber The number of the completed round.
	 * @param honba The honba of the completed round.
	 * @param startingRiichiSticks The number of riichi sticks before the round happened.
	 * @param riichis A list of player indexes who have riichied during the completed round.
	 * @param transactions A list of transactions that happened during the completed round.
	 */
	roundWind: Wind;
	roundNumber: number;
	honba: number;
	startingRiichiSticks: number;
	riichis: number[];
	endingRiichiSticks: number;
	transactions: Transaction[];
}

export interface BackendToFrontendRound {
	roundWind: Wind;
	roundNumber: number;
	honba: number;
	startingRiichiSticks: number;
}
