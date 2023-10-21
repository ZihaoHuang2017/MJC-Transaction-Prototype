import {describe} from "mocha";
import chaiAsPromised from "chai-as-promised";
import {JapaneseRound, WIND} from "../../src/controller/MahjongRound";
import {expect, use} from "chai";

use(chaiAsPromised);

describe("A mahjong round should be set up correctly", () => {
	it("should set up correctly", () => {
		const round1 = new JapaneseRound(
			[
				{playerName: "A", score: 25000},
				{playerName: "B", score: 25000},
				{playerName: "C", score: 25000},
				{playerName: "D", score: 25000},
			],
			WIND.EAST,
			1,
			0,
			0
		);
		expect(round1.getPlayerLocalIndex("A")).equal(0);
		const round2 = new JapaneseRound(
			[
				{playerName: "A", score: 25000},
				{playerName: "B", score: 25000},
				{playerName: "C", score: 25000},
				{playerName: "D", score: 25000},
			],
			WIND.EAST,
			2,
			0,
			0
		);
		expect(round2.getPlayerLocalIndex("A")).equal(3);
		expect(round2.getPlayerLocalIndex("B")).equal(0);
		const round4 = new JapaneseRound(
			[
				{playerName: "A", score: 25000},
				{playerName: "B", score: 25000},
				{playerName: "C", score: 25000},
				{playerName: "D", score: 25000},
			],
			WIND.EAST,
			4,
			0,
			0
		);
		expect(round4.getPlayerLocalIndex("A")).equal(1);
		expect(round4.getPlayerLocalIndex("B")).equal(2);
	});
	it("should calculate ron correctly", () => {
		const round2 = new JapaneseRound(
			[
				{playerName: "A", score: 25000},
				{playerName: "B", score: 25000},
				{playerName: "C", score: 25000},
				{playerName: "D", score: 25000},
			],
			WIND.EAST,
			2,
			0,
			0
		);
		const ronResult1 = round2.addRon("B", "C", {
			fu: 30,
			han: 3,
			honba: 0,
		});
		expect(ronResult1).deep.equal([0, 5800, -5800, 0]);
		const ronResult2 = round2.addRon("A", "C", {
			fu: 60,
			han: 3,
			honba: 2,
		});
		expect(ronResult2).deep.equal([8300, 0, -8300, 0]);
	});
	it("should calculate tsumo correctly", () => {
		const round2 = new JapaneseRound(
			[
				{playerName: "A", score: 25000},
				{playerName: "B", score: 25000},
				{playerName: "C", score: 25000},
				{playerName: "D", score: 25000},
			],
			WIND.EAST,
			2,
			0,
			0
		);
		const tsumoResult1 = round2.addTsumo("B", {
			fu: 30,
			han: 4,
			honba: 0,
		});
		expect(tsumoResult1).deep.equal([-3900, 11700, -3900, -3900]);
		const tsumoResult2 = round2.addTsumo("A", {
			fu: 40,
			han: 3,
			honba: 2,
		});
		expect(tsumoResult2).deep.equal([5800, -2800, -1500, -1500]);
	});
});
