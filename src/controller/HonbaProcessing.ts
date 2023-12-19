import {ActionType, Transaction} from "./Types";

function containingAny(transactions: Transaction[], actionType: ActionType): Transaction | null {
	for (const transaction of transactions) {
		if (transaction.actionType === actionType) {
			return transaction;
		}
	}
	return null;
}

export function transformTransactions(transactions: Transaction[], honba: number) {
	const transaction: Transaction = determineHonbaTransaction(transactions);
	addHonba(transaction, honba);
	return transactions;
}

function determineHonbaTransaction(transactions: Transaction[]) {
	if (transactions.length === 1) {
		return transactions[0];
	}
	const potentialTsumo = containingAny(transactions, ActionType.TSUMO);
	if (potentialTsumo) {
		return potentialTsumo;
	}
	const {winners, losers} = getProminentPlayers(transactions);
	const [loser] = losers; // should only have one real loser
	const closestWinnerIndex = getClosestWinner(loser, winners);
	for (const transaction of transactions) {
		if (transaction.scoreDeltas[closestWinnerIndex] > 0) {
			return transaction;
		}
	}
	throw new Error("Should not reach here." + transactions);
}

export function addHonba(transaction: Transaction, honbaCount: number) {
	// MODIFIES: transaction; perhaps it is better to make it functional, but I don't want to spend in the effort
	switch (transaction.actionType) {
		case ActionType.CHOMBO:
		case ActionType.NAGASHI_MANGAN:
		case ActionType.TENPAI:
			break;
		case ActionType.TSUMO:
			for (const index in transaction.scoreDeltas) {
				if (transaction.scoreDeltas[index] > 0) {
					transaction.scoreDeltas[index] += 300 * honbaCount;
				} else {
					transaction.scoreDeltas[index] -= 100 * honbaCount;
				}
			}
			break;
		case ActionType.RON:
		case ActionType.DEAL_IN_PAO:
			for (const index in transaction.scoreDeltas) {
				if (transaction.paoTarget !== undefined && transaction.paoTarget === +index) {
					continue;
				}
				if (transaction.scoreDeltas[index] > 0) {
					transaction.scoreDeltas[index] += 300 * honbaCount;
				} else if (transaction.scoreDeltas[index] < 0){
					transaction.scoreDeltas[index] -= 300 * honbaCount;
				}
			}
			break;
		case ActionType.SELF_DRAW_PAO:
			for (const index in transaction.scoreDeltas) {
				if (transaction.scoreDeltas[index] > 0) {
					transaction.scoreDeltas[index] += 300 * honbaCount;
				} else if (transaction.scoreDeltas[index] < 0) {
					transaction.scoreDeltas[index] -= 300 * honbaCount;
				}
			}
			break;
	}
	return transaction;
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
	const winners = new Set<number>();
	const losers = new Set<number>();
	for (const transaction of transactions) {
		for (let index = 0; index < transaction.scoreDeltas.length; index++) {
			if (transaction.paoTarget !== undefined && transaction.paoTarget === index) {
				// is pao target
				continue;
			}
			if (transaction.scoreDeltas[index] < 0) {
				losers.add(index);
			} else if (transaction.scoreDeltas[index] > 0) {
				winners.add(index);
			}
		}
	}
	return {winners, losers};
}
