
import RPi.GPIO as GPIO

GPIO.setmode(GPIO.BCM)
pins = [26, 19, 13, 21, 20, 16]
for pin in pins:
	GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)

all_up = True
all_down = True

for pin in pins:
	if GPIO.input(pin):
		all_up = False
	else:
                all_down = False

if all_up:
        print "True"
elif all_down:
        print "False"
else:
        print "Mix"

