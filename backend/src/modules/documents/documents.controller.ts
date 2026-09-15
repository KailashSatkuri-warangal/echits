import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Get('receipts/:paymentId/pdf')
  @ApiOperation({ summary: 'Stream printable PDF receipt with QR verification' })
  async downloadReceiptPdf(@Param('paymentId') paymentId: string, @Res() res: Response) {
    const pdfBuffer = await this.documentsService.generateReceiptPdf(paymentId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Receipt-${paymentId}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }
}
