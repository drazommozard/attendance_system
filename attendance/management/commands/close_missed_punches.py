from datetime import datetime

from django.core.management.base import BaseCommand

from attendance.models import AttendanceRecord


class Command(BaseCommand):
    help = 'Scans for yesterday’s open shifts and marks them as Missed Punch'

    def handle(self, *args, **kwargs):
        # 1. Get today's date
        today = datetime.now().date()
        
        # 2. Find all records strictly older than today where time_out is empty
        open_records = AttendanceRecord.objects.filter(
            date__lt=today,          # Date is strictly less than today
            time_out__isnull=True    # Employee never clocked out
        )

        count = open_records.count()

        if count == 0:
            self.stdout.write(self.style.SUCCESS("Clean scan. No missed clock-outs found!"))
            return

        # 3. Loop through the abandoned records and update their status
        for record in open_records:
            record.status = 'Missed Punch'
            record.save()

        # 4. Print a success message to the terminal
        self.stdout.write(self.style.SUCCESS(f"Successfully caught and marked {count} 'Missed Punch' records."))