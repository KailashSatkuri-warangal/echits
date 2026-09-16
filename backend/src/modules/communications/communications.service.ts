import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentsService } from '../payments/payments.service';
import { MembersService } from '../members/members.service';
import { CurrencyUtil } from '../../common/utils/currency.util';

@Injectable()
export class CommunicationsService {
  constructor(
    private paymentsService: PaymentsService,
    private membersService: MembersService,
  ) {}

  async getReceiptWhatsAppMessage(paymentId: string) {
    const data = await this.paymentsService.getReceiptData(paymentId);
    const phone = data.member.phone.replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('91') ? phone : `91${phone}`;

    let text = `*Sudhakar Chits - Payment Receipt*\n\n`;
    text += `Dear *${data.member.name}* (${data.member.code}),\n`;
    text += `We have successfully received your payment.\n\n`;
    text += `📄 *Receipt No:* ${data.receiptNumber}\n`;
    text += `💰 *Amount Paid:* ${CurrencyUtil.formatINR(data.amount)}\n`;
    text += `💳 *Mode:* ${data.paymentMode}\n`;
    text += `📅 *Date:* ${new Date(data.date).toLocaleDateString('en-IN')}\n`;

    if (data.chit) {
      text += `🏷️ *Chit Scheme:* ${data.chit.name} [${data.chit.code}]\n`;
    }

    if (data.advanceAmount > 0) {
      text += `✨ *Advance Credited:* ${CurrencyUtil.formatINR(data.advanceAmount)}\n`;
    }

    text += `📊 *Remaining Scheme Balance:* ${CurrencyUtil.formatINR(data.remainingChitBalance)}\n\n`;
    text += `Thank you for choosing Sudhakar Chits!`;

    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

    return {
      recipientPhone: cleanPhone,
      messageText: text,
      whatsappUrl,
    };
  }

  async getDueReminderWhatsAppMessage(memberId: string) {
    const data = await this.membersService.getMember360(memberId);
    const phone = data.member.phone.replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('91') ? phone : `91${phone}`;

    let text = `*Sudhakar Chits - Payment Reminder*\n\n`;
    text += `Dear *${data.member.fullName}* (${data.member.memberCode}),\n`;
    text += `This is a gentle reminder regarding your pending chit installments:\n\n`;

    data.summary.chits.forEach((c) => {
      if (c.pendingAmount > 0) {
        text += `• *${c.chitName}* (${c.chitCode}): ${CurrencyUtil.formatINR(c.pendingAmount)} pending\n`;
      }
    });

    text += `\n🔴 *Total Outstanding:* ${CurrencyUtil.formatINR(data.summary.totalOutstanding)}\n\n`;
    text += `Please complete your payment to keep your membership up to date.\n`;
    text += `Thank you, Sudhakar Chits Collections Team.`;

    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

    return {
      recipientPhone: cleanPhone,
      messageText: text,
      whatsappUrl,
    };
  }
}
