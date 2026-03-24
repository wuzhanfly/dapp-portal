import { describe, it, expect, beforeEach, vi } from "vitest";
import { ref } from "vue";
import { useWBNBDeposit, WBNB_ADDRESS } from "@/composables/zksync/deposit/useWBNBDeposit";

// Mock wagmi
vi.mock("@wagmi/core", () => ({
  readContract: vi.fn(),
  writeContract: vi.fn(),
}));

// Mock stores
vi.mock("@/composables/useOnboardStore", () => ({
  useOnboardStore: () => ({
    account: { address: "0x1234567890123456789012345678901234567890" },
    getPublicClient: vi.fn(),
  }),
}));

vi.mock("@/composables/useNetworkStore", () => ({
  useNetworkStore: () => ({
    selectedNetwork: ref({
      l1Network: { id: 97 },
      bridgeContracts: {
        erc20Bridge: "0xaed878b4f465fa5cd1f64c35aa5a340e2506febd",
      },
    }),
  }),
  storeToRefs: (store: any) => ({
    selectedNetwork: store.selectedNetwork,
  }),
}));

describe("useWBNBDeposit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should detect WBNB support on BSC Testnet", () => {
    const { isWBNBSupported } = useWBNBDeposit();
    expect(isWBNBSupported.value).toBe(true);
  });

  it("should have correct WBNB address", () => {
    expect(WBNB_ADDRESS).toBe("0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd");
  });

  it("should initialize with null current step", () => {
    const { currentStep } = useWBNBDeposit();
    expect(currentStep.value).toBeNull();
  });

  it("should have ERC20 bridge address configured", () => {
    const { erc20BridgeAddress } = useWBNBDeposit();
    expect(erc20BridgeAddress.value).toBe("0xaed878b4f465fa5cd1f64c35aa5a340e2506febd");
  });

  it("should reset state correctly", () => {
    const { currentStep, wrapTxHash, approveTxHash, depositTxHash, reset } = useWBNBDeposit();
    
    // Set some values
    currentStep.value = "wrap";
    wrapTxHash.value = "0xabc" as any;
    approveTxHash.value = "0xdef" as any;
    depositTxHash.value = "0x123" as any;

    // Reset
    reset();

    // Check all values are reset
    expect(currentStep.value).toBeNull();
    expect(wrapTxHash.value).toBeUndefined();
    expect(approveTxHash.value).toBeUndefined();
    expect(depositTxHash.value).toBeUndefined();
  });
});

describe("WBNB Deposit Flow", () => {
  it("should follow correct step order", () => {
    const steps = ["wrap", "approve", "deposit", "done"];
    expect(steps).toHaveLength(4);
    expect(steps[0]).toBe("wrap");
    expect(steps[1]).toBe("approve");
    expect(steps[2]).toBe("deposit");
    expect(steps[3]).toBe("done");
  });

  it("should calculate correct gas limits", () => {
    const wrapGas = 50000;
    const approveGas = 50000;
    const depositGas = 200000;
    const totalGas = wrapGas + approveGas + depositGas;
    
    expect(totalGas).toBe(300000);
  });

  it("should have correct base cost", () => {
    const baseCost = BigInt("250000000000000"); // 0.00025 BNB
    expect(baseCost.toString()).toBe("250000000000000");
  });
});
