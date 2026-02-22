import fs from 'fs';

const filePath = './components/booking/booking-form.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Fix the validation alert
content = content.replace(
  `alert('Please select a room type (Double or Single Occupancy)')`,
  `alert('Please select your accommodation')`
);

// 2. Fix the occupancyType assignment
content = content.replace(
  `roomType === 'double' ? 'Double Occupancy' : 'Single Occupancy'`,
  `'Standard Accommodation'`
);

// 3. Replace Section 2: Select Room Type with Accommodation section
const oldSection = `          {/* Section 2: Select Room Type */}
          <div className="overflow-hidden">
            <SectionHeader number={2} title="Select Room Type" />
            <div className="mt-6 space-y-4">
              <RadioOption
                selected={roomType === 'double'}
                onClick={() => setRoomType('double')}
              >
                <div className="flex items-start gap-3">
                  <Users className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-serif text-xl font-medium">
                      Double Occupancy
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Share a room with another guest for a more economical
                      option
                    </p>
                  </div>
                </div>
              </RadioOption>

              <RadioOption
                selected={roomType === 'single'}
                onClick={() => setRoomType('single')}
              >
                <div className="flex items-start gap-3">
                  <User className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-serif text-xl font-medium">
                      Single Occupancy
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Private room for yourself for maximum comfort and privacy
                    </p>
                  </div>
                </div>
              </RadioOption>
            </div>
          </div>`;

const newSection = `          {/* Section 2: Accommodation */}
          <div className="overflow-hidden">
            <SectionHeader number={2} title="Accommodation" />
            <div className="mt-6 space-y-4">
              <RadioOption
                selected={roomType === 'standard'}
                onClick={() => setRoomType('standard')}
              >
                <div className="flex items-start gap-3">
                  <Users className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-serif text-xl font-medium">
                      Standard Accommodation
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Comfortable room included with your package
                    </p>
                  </div>
                </div>
              </RadioOption>
            </div>
          </div>`;

content = content.replace(oldSection, newSection);

// 4. Fix summary references - single/double occupancy text
content = content.replace(
  `{roomType === 'single'
                          ? 'Single Occupancy'
                          : 'Double Occupancy'}`,
  `{'Standard Accommodation'}`
);

// 5. Fix the right column room label
content = content.replace(
  `{roomType === 'single'
                      ? 'Single Occupancy Room'
                      : 'Double Occupancy Room'}`,
  `{'Accommodation'}`
);

// 6. Remove the unused User import (keep Users)
content = content.replace(
  `  Users,
  User,`,
  `  Users,`
);

// 7. Fix the accommodation images section to use single room_photo_url
content = content.replace(
  /\/\/ Show only accommodation images in booking details\n\s*const accommodationImages:.*?\n.*?if \(trip\.double_room_photo_url\).*?\n.*?accommodationImages\.push\(\{[\s\S]*?display_order: accommodationImages\.length,\n\s*\}\)\n\s*\}\n\s*const tripImages = accommodationImages/,
  `// Show accommodation image in booking details
  const accommodationImages: Array<{ image_url: string; display_order: number }> = []
  if (trip.room_photo_url) {
    accommodationImages.push({
      image_url: trip.room_photo_url,
      display_order: 0,
    })
  }
  const tripImages = accommodationImages`
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Booking form updated successfully!');

// Verify changes
const updated = fs.readFileSync(filePath, 'utf-8');
const remaining = [
  'Double Occupancy',
  'Single Occupancy', 
  'Select Room Type',
  "roomType === 'double'",
  "roomType === 'single'",
  'double_room_photo_url',
  'single_room_photo_url',
].filter(term => updated.includes(term));

if (remaining.length > 0) {
  console.log('WARNING: Still found references to:', remaining);
} else {
  console.log('All single/double references have been removed!');
}
