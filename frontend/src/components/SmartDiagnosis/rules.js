export const diagnosisDataBase = {
  ac: {
    id: 'ac',
    title: 'AC Repair',
    icon: 'Snowflake',
    questions: [
      {
        id: 'power',
        question: 'Is the AC turning ON?',
        options: [
          { label: 'Yes, it turns on', value: 'yes' },
          { label: 'No, completely dead', value: 'no' }
        ]
      },
      {
        id: 'cooling',
        question: 'How is the cooling?',
        options: [
          { label: 'Not cooling at all', value: 'none' },
          { label: 'Cooling is weak', value: 'weak' },
          { label: 'Cooling is fine', value: 'fine' }
        ]
      },
      {
        id: 'issue',
        question: 'Any other noticeable issues?',
        options: [
          { label: 'Unusual loud noise', value: 'noise' },
          { label: 'Water leaking inside', value: 'leak' },
          { label: 'Foul smell', value: 'smell' },
          { label: 'None of the above', value: 'none' }
        ]
      }
    ],
    evaluate: (answers) => {
      const { power, cooling, issue } = answers;
      
      if (power === 'no') {
        return {
          problem: 'Compressor PCB Failure or Power Supply Issue',
          priceRange: '₹500 - ₹3000',
          recommendation: 'Requires detailed electrical inspection. Do not try to turn it on repeatedly.'
        };
      }

      if (cooling === 'none' && power === 'yes') {
        return {
          problem: 'Gas Leakage or Compressor Tripping',
          priceRange: '₹1500 - ₹2500',
          recommendation: 'Likely needs AC gas refill and professional leak testing.'
        };
      }

      if (cooling === 'weak') {
        if (issue === 'leak') {
          return {
            problem: 'Blocked Drain Pipe & Dirty Filters',
            priceRange: '₹400 - ₹900',
            recommendation: 'Deep cleaning and unblocking water drainage required.'
          };
        }
        return {
          problem: 'Clogged Condenser or Low Refrigerant',
          priceRange: '₹500 - ₹1500',
          recommendation: 'AC Servicing/Jet Cleaning or minor gas top-up needed.'
        };
      }

      if (issue === 'noise') {
        return {
          problem: 'Blower Motor Issue or Loose Parts',
          priceRange: '₹800 - ₹2000',
          recommendation: 'Requires motor bearing check or fan blade realignment.'
        };
      }

      return {
        problem: 'General Maintenance Required',
        priceRange: '₹400 - ₹800',
        recommendation: 'Standard wet servicing should resolve minor performance issues.'
      };
    }
  },
  plumbing: {
    id: 'plumbing',
    title: 'Plumbing',
    icon: 'Droplet',
    questions: [
      {
        id: 'type',
        question: 'What type of plumbing issue is it?',
        options: [
          { label: 'Leaking pipe or tap', value: 'leak' },
          { label: 'Blocked drain/toilet', value: 'blockage' },
          { label: 'No water supply', value: 'no_water' },
          { label: 'Installation (Geyser, motor, etc.)', value: 'install' }
        ]
      },
      {
        id: 'intensity',
        question: 'How severe is the issue?',
        options: [
          { label: 'Emergency (Flood/continuous leak)', value: 'high' },
          { label: 'Moderate (Slow leak/clog)', value: 'medium' },
          { label: 'Routine/Minor', value: 'low' }
        ]
      }
    ],
    evaluate: (answers) => {
      const { type, intensity } = answers;
      
      if (type === 'leak') {
        return {
          problem: intensity === 'high' ? 'Major Pipe Burst or Valve Failure' : 'Tap Spindle/Washer Depleted',
          priceRange: intensity === 'high' ? '₹800 - ₹2500' : '₹150 - ₹500',
          recommendation: 'Turn off the main water valve immediately to prevent water damage.'
        };
      }
      
      if (type === 'blockage') {
        return {
          problem: intensity === 'high' ? 'Severe Main Line Blockage' : 'Minor Trap Blockage',
          priceRange: '₹300 - ₹1200',
          recommendation: 'Needs mechanical rodding or plunger. Avoid using chemical drain cleaners without caution.'
        };
      }
      
      if (type === 'install') {
        return {
          problem: 'New Fixture Installation',
          priceRange: '₹250 - ₹800',
          recommendation: 'Ensure you have the required fixtures ready before the technician arrives.'
        };
      }
      
      return {
        problem: 'General Plumbing Inspection',
        priceRange: '₹150 - ₹400',
        recommendation: 'Technician needs to assess the water line.'
      };
    }
  },
  electrical: {
    id: 'electrical',
    title: 'Electrician',
    icon: 'Zap',
    questions: [
      {
        id: 'issue',
        question: 'What seems to be the electrical problem?',
        options: [
          { label: 'Power trip/Short circuit', value: 'short' },
          { label: 'Appliance not working', value: 'appliance' },
          { label: 'Wiring/Switchbox issue', value: 'wiring' },
          { label: 'Installation (Fan, Lights)', value: 'install' }
        ]
      },
      {
        id: 'scope',
        question: 'Does this affect the whole house or a specific area?',
        options: [
          { label: 'Entire House', value: 'all' },
          { label: 'Specific Room/Board', value: 'room' },
          { label: 'Just one appliance/socket', value: 'one' }
        ]
      }
    ],
    evaluate: (answers) => {
      const { issue, scope } = answers;
      
      if (issue === 'short') {
        return {
          problem: scope === 'all' ? 'Main MCB Failure or Phase Issue' : 'Localized Short Circuit in Wiring',
          priceRange: scope === 'all' ? '₹500 - ₹1500' : '₹200 - ₹800',
          recommendation: 'Do NOT try to reset MCB continuously if it trips. Keep main power off.'
        };
      }
      
      if (issue === 'wiring') {
        return {
          problem: 'Burnt Wiring or Faulty Socket/Switch',
          priceRange: '₹150 - ₹600',
          recommendation: 'Material costs (new switch/socket/wires) will be extra based on actual usage.'
        };
      }
      
      if (issue === 'install') {
        return {
          problem: 'Fixture Installation',
          priceRange: '₹100 - ₹400',
          recommendation: 'Standard installation charges per unit.'
        };
      }
      
      return {
        problem: 'Electrical Fault Diagnosis',
        priceRange: '₹200 - ₹500',
        recommendation: 'An electrician needs to trace the fault using an electrical tester/multimeter.'
      };
    }
  }
};
