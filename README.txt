### README - Les Kirbies - GL02


Course Definition :
<course-def> = "+" <course-code> CRLF *(<time-slot>)

<course-code> = 2ALPHA 2DIGIT
## Changed to this to fit existing datas -->
<course-code>  = <letters> <digits> [letters digit]
<letters>      = 2*3ALPHA
<digits>       = 1*2DIGIT
##

Each course begins with a ‘+’ followed by a unique ‘course-code’. The course code consists
of two letters and two digits.

Time Slot :
<time-slot> = <slot-id> "," <type> "," <capacity> "," <time> "," <group-id> "," <room> "//" CRLF
<slot-id> = DIGIT
<type> = ALPHA 1-2DIGIT ## Changed to this --> <type> = ALPHA DIGIT ##
<capacity> = "P=" 1-3DIGIT
<time> = "H=" day WSP <time-range>
<day> = 1-2ALPHA
<time-range> = <time-start> "-" <time-end>
<time-start> = 1-2DIGIT ":" 2DIGIT
<time-end> = 1-2DIGIT ":"2DIGIT
<groupe-id> = "F" 1(DIGIT / ALPHA) ## Changed to this --> <groupe-id> = "F" DIGIT ##
<room> = "S=" <room-code>
<room-code> = (1ALPHA 3DIGIT) / (3ALPHA 1DIGIT)

Each time slot is represented by a unique ‘slot-id’, followed by information such as type,
participant capacity, time, day, group ID, and room code.
