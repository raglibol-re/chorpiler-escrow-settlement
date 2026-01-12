// scripts/paymentExtension.ts - Your Token Transfer Extension
interface PaymentTask {
    taskId: string;
    payerParticipant: string;    // e.g., "Customer"
    payeeParticipant: string;    // e.g., "Pizza Place" 
    amount?: string;             // e.g., "1 ether"
  }
  
  class PaymentExtension {
    detectPaymentTasks(bpmnXml: string): PaymentTask[] {
      // Parse BPMN and find tasks with "pay" in name
      // Return payment task configurations
    }
    
    extendContract(contractCode: string, paymentTasks: PaymentTask[]): string {
      // Add escrow functionality
      // Modify enact function to handle payments
      // Return extended contract
    }
  }