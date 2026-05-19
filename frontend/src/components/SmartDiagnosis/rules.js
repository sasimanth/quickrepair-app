export const diagnosisDataBase = {
  repair: {
    id: 'repair',
    title: 'Repair',
    icon: 'Hammer',
    questions: [
      {
        id: 'deviceType',
        question: 'What needs to be repaired?',
        options: [
          { label: 'Electronic/Appliance (AC, TV, Fridge)', value: 'appliance' },
          { label: 'Plumbing (Pipes, Taps, Leak)', value: 'plumbing' },
          { label: 'Electrical (Wiring, DB board)', value: 'electrical' },
          { label: 'Other/Not sure', value: 'other' }
        ]
      },
      {
        id: 'issueLevel',
        question: 'How severe is the problem?',
        options: [
          { label: 'Completely dead/Not working at all', value: 'dead' },
          { label: 'Working partially but faulty', value: 'partial' },
          { label: 'Making noise/Smell/Leak', value: 'symptoms' }
        ]
      }
    ],
    evaluate: (answers) => {
      const { issueLevel } = answers;
      if (issueLevel === 'dead') {
        return {
          problem: 'Major Component Failure',
          priceRange: '₹500 - ₹3000+',
          recommendation: 'Needs immediate inspection to identify the dead component. Best to keep the main power off.'
        };
      }
      return {
        problem: 'Faulty Operation / Partial Failure',
        priceRange: '₹300 - ₹1500',
        recommendation: 'A technician will diagnose the symptom and replace minor parts if needed.'
      };
    }
  },
  installation: {
    id: 'installation',
    title: 'Installation',
    icon: 'Wrench',
    questions: [
      {
        id: 'installType',
        question: 'What do you need installed?',
        options: [
          { label: 'Large Appliance (AC, TV, Geyser)', value: 'large_appliance' },
          { label: 'Electrical Fixtures (Fans, Lights)', value: 'electrical' },
          { label: 'Plumbing Fixtures (Taps, Sinks, Showers)', value: 'plumbing' },
          { label: 'Furniture / Carpentry Assembly', value: 'carpentry' }
        ]
      },
      {
        id: 'readiness',
        question: 'Do you have the product ready?',
        options: [
          { label: 'Yes, just need installation', value: 'yes' },
          { label: 'No, need technician to bring items/spares', value: 'no' }
        ]
      }
    ],
    evaluate: (answers) => {
      const { readiness, installType } = answers;
      
      if (readiness === 'no') {
        return {
          problem: 'Supply & Installation Required',
          priceRange: '₹500 - ₹2000 + Material Cost',
          recommendation: 'Technician will give you a quote for both materials and labor charges.'
        };
      }
      
      return {
        problem: 'Standard Installation Request',
        priceRange: installType === 'large_appliance' ? '₹800 - ₹1500' : '₹200 - ₹600',
        recommendation: 'Ensure the mounting area is clear before the technician arrives.'
      };
    }
  },
  cleaning: {
    id: 'cleaning',
    title: 'Cleaning',
    icon: 'Sparkles',
    questions: [
      {
        id: 'cleanType',
        question: 'What kind of cleaning service do you need?',
        options: [
          { label: 'Deep Home Cleaning', value: 'home' },
          { label: 'Sofa / Carpet Cleaning', value: 'furniture' },
          { label: 'Bathroom / Kitchen Deep Clean', value: 'room' },
          { label: 'Water Tank Cleaning', value: 'tank' }
        ]
      },
      {
        id: 'size',
        question: 'What is the scale of the job?',
        options: [
          { label: 'Small (1BHK/Single Item)', value: 'small' },
          { label: 'Medium (2BHK-3BHK)', value: 'medium' },
          { label: 'Large (Villa/Full House)', value: 'large' }
        ]
      }
    ],
    evaluate: (answers) => {
      const { cleanType, size } = answers;
      if (cleanType === 'home' || cleanType === 'room') {
         if (size === 'large') {
           return {
             problem: 'Large Scale Deep Cleaning',
             priceRange: '₹3000 - ₹6000',
             recommendation: 'A team of 2-3 cleaners will bring professional equipment.'
           };
         }
         return {
             problem: 'Standard Deep Cleaning',
             priceRange: '₹1000 - ₹2500',
             recommendation: 'Includes chemical wash, scrubbing, and sanitization.'
         };
      }
      
      return {
        problem: 'Specialized Cleaning Service',
        priceRange: '₹500 - ₹1500',
        recommendation: 'Using specialized vacuum and shampooing machines.'
      };
    }
  },
  other: {
    id: 'other',
    title: 'Other',
    icon: 'PlusCircle',
    questions: [
      {
        id: 'otherDesc',
        question: 'Is this an emergency request?',
        options: [
          { label: 'Yes, need someone ASAP', value: 'yes' },
          { label: 'No, regular checkup/query', value: 'no' }
        ]
      }
    ],
    evaluate: (answers) => {
       const { otherDesc } = answers;
       if (otherDesc === 'yes') {
         return {
           problem: 'Emergency Custom Service',
           priceRange: 'Inspection Fee First',
           recommendation: 'We prioritize emergency requests. A technician will evaluate the issue directly.'
         };
       }
       return {
         problem: 'Custom Service Request',
         priceRange: 'Varies',
         recommendation: 'Technician will visit and provide a firm quote based on your exact requirement.'
       };
    }
  }
};
