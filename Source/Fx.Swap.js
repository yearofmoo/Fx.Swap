if(!window.Fx) {
  throw new Error('Fx.Swap.js: MooTools-core library not included');
}
if(!window.Fx.Elements) {
  throw new Error('Fx.Swap.js: MooTools-more library not included');
}

Fx.Swap = new Class({

  Implements : [Options, Events, Chain],

  Binds : ['onComplete'],

  Binds : [],

  options : {
    swapper : 'base',
    swapperOptions : {

    },
    containerClassName : null,
    elementClassName : 'current',
    hiddenClassName : null
  },

  initialize : function(container) {
    this.setContainer(container);
    this.setSwapper(this.getSwapperClass(),this.options.swapperOptions);
    this.setCurrentElement(this.getContainer().getFirst());
  },

  setContainer : function(container) {
    this.container = document.id(container);
  },

  getContainer : function() {
    return this.container;
  },

  setCurrentElement : function(element) {
    var current = this.getCurrentElement();
    if(current) {
      current.destroy();
    }
    this.getContainer().empty();
    element.addClass(this.options.elementClassName);
    element.inject(this.getContainer());
  },

  reverse : function() {
    this.isReverse = !this.isReverse;
  },

  getSwapper : function() {
    return this.swapper;
  },

  setSwapper : function(klass,options) {
    this.options.swapper = klass;
    this.swapper = new Fx.Swap.Swappers[klass](options);
  },

  getSwapperClass : function() {
    return this.options.swapper.charAt(0).toUpperCase() + this.options.swapper.substr(1);
  },

  getCurrentElement : function() {
    if(!this.currentElement) {
      this.currentElement = this.getContainer().getElement('.'+this.options.elementClassName);
    }
    return this.currentElement;
  },

  setCurrentElement : function(element) {
    this.currentElement = element;
  },

  swap : function(element) {
    this.swapElements(this.getCurrentElement(),element);
  },

  hideElement : function(element) {
    element.setStyle('display','none');
  },

  swapElements : function(one,two) {
    if(!two.ownerNode) {
      this.hideElement(two);
      two.inject(this.getContainer(),'bottom');
    }
    this.onBeforeSwap(one,two);
    var swapper = this.getSwapper();
    swapper.setElements(this.getContainer(),one,two);
    swapper.run(function() {
      this.onComplete(one,two);
    }.bind(this));
  },

  onComplete : function(one, two) {
    this.onAfterSwap(one,two);
    var on = this.options.elementClassName;
    var off = this.options.hiddenClassName;
    one.removeClass(on).addClass(off);
    two.removeClass(off).addClass(on); 
    this.callChain();
  },

  onBeforeSwap : function(one,two) {
    this.setCurrentElement(one);
    $$(one,two).addClass('swap-active');
    one.addClass('swap-active-one');
    two.addClass('swap-active-two');
  },

  onAfterSwap : function(one,two) {
    $$(one,two).removeClass('swap-active');
    one.removeClass('swap-active-one');
    two.removeClass('swap-active-two');
    this.hideElement(one);
    this.setCurrentElement(two);
  }

});

Fx.Swap.Swappers = {};
Fx.Swap.Swappers.Base = new Class({

  Implements : [Options, Events, Chain],

  options : {
    wait : true,
    zIndexBase : 1000,
    fxOptions : {
    },
    animations : {
      before : {
        set : {
          '0' : {
            height:'1',
            position:'relative',
            overflow:'hidden'
          },
          '1' : {
            position:'absolute',
            display:'block',
            top : 0,
            left : 0,
            right : 0
          },
          '2' : {
            position:'absolute',
            display:'none',
            top : 0,
            left : 0,
            right : 0
          }
        }
      },
      during : {
        set : {
          '0':{
            height:'2'
          }
        }
      },
      after : {
        set : {
          '0':{
            overflow:'visible',
            height:'auto'
          },
          '1' : {
            display:'none',
            position:'static'
          },
          '2' : {
            display:'block',
            position:'static'
          }
        }
      }
    }
  },

  initialize : function(options) {
    this.setOptions(options);
  },

  getAnimator : function() {
    if(!this.animator) {
      this.animator = new Fx.Elements(Object.values(this.getElements()),this.options.fxOptions);
    }
    return this.animator;
  },

  wait : function() {
    return this.options.wait;
  },

  setElements : function(container, one, two) {
    this.elements = {
      '0' : container,
      '1' : one,
      '2' : two
    };
    this.animator = null;
  },

  getElement : function(key) {
    return this.getElements()[key];
  },

  getElements : function() {
    return this.elements;
  },

  run : function(fn) {
    var that = this;
    that.before(function() {
      that.during(function() {
        that.after(function() {
          fn();
        });
      });
    });
  },

  animate : function(phase,fn) {
    var values = this.getAnimationValues(phase);
    if(values.set) {
      this.animateSet(values.set);
    }
    if(values.start) {
      this.animateStart(values.start);
      var wait = values.wait || this.wait();
      wait ? this.chain(fn) : fn();
    }
    else {
      fn();
    }
  },

  before : function(fn) {
    this.animate('before',fn);
  },

  during : function(fn) {
    this.animate('during',fn);
  },

  after : function(fn) {
    this.animate('after',fn);
  },

  getCalculations : function(element) {
    var size = element.getDimensions();
    return {
      width : size.width,
      height : size.height,
      left : size.width,
      top : size.height
    };
  },

  parseAnimationValues : function(element,values) {
    var minus;
    values = values || {};
    ['top','left','width','height'].each(function(key) {
      var value = values[key];
      if(typeOf(value) == 'string' && value.length <= 2) {
        minus = false;
        var element = value;
        if(value.length == 2) {
          minus = value.charAt(0) == '-';
          value = value.substr(1);
          element = value;
        }
        element = this.getElement(element);
        value = this.getCalculations(element)[key];
        if(minus) {
          value *= -1;
        }
        values[key]=value;
      }
    },this);
    values['z-index'] = this.getNextZIndexValue();
    return values;
  },

  getAnimations : function() {
    return this.options.animations;
  },

  getAnimationValues : function(phase) {
    var values = {
      set : {},
      start : {}
    };
    ['0','1','2'].each(function(key) {
      var data = this.getElementAnimationValues(key,phase);
      ['start','set'].each(function(area) {
        if(data[area]) {
          values[area][key]=data[area]
        }
      });
    },this);
    if(Object.keys(values.set).length==0) {
      delete values.set;
    }
    if(Object.keys(values.start).length==0) {
      delete values.start;
    }
    return values;
  },

  getNextZIndexValue : function() {
    if(!this.z) {
      this.z = this.options.zIndexBase;
    }
    return ++this.z;
  },

  getElementAnimationValues : function(key,phase) {
    var element = this.getElement(key);
    var values = this.getAnimations()[phase];
    var start = set = null;
    var wait = false;
    if(values) {
      wait = values.wait;
      set = values.set && values.set[key] ? this.parseAnimationValues(element,values.set[key]) : null;
      start = values.start && values.start[key] ? this.parseAnimationValues(element,values.start[key]) : null;
    }
    return {
      wait : wait,
      set : set,
      start : start
    };
  },

  animateSet : function(styles) {
    this.getAnimator().set(styles);
  },

  animateStart : function(styles) {
    this.getAnimator().start(styles).chain(this.callChain.bind(this));
  }

});

Fx.Swap.Swappers.Replace = new Class({

  Extends : Fx.Swap.Swappers.Base,

  initialize : function(options) {
    this.parent(options);
    this.options.animations = {
      before : {
        set : {
          '1' : {
            display : 'block'
          },
          '2' : {
            display : 'none'
          }
        }
      },
      after : {
        set : {
          '1' : {
            display : 'none'
          },
          '2' : {
            display : 'block'
          }
        }
      }
    }
  }

});

Fx.Swap.Swappers.Fade = new Class({

  Extends : Fx.Swap.Swappers.Base,

  options : {
    animations : {
      before : {
        set : {
          '1' : {
            display : 'block',
            opacity : 1,
          },
          '2' : {
            display : 'block',
            opacity : 0
          }
        }
      },
      during : {
        start : {
          '1':{
            opacity : 0
          },
          '2':{
            opacity : 1
          }
        }
      }
    }
  }

});

Fx.Swap.Swappers.Push = new Class({

  Extends : Fx.Swap.Swappers.Base,

  options : {
    animations : {
      before : {
        set : {
          '1' : {
            top : 0
          },
          '2' : {
            display : 'block',
            top : '-2'
          }
        }
      },
      during : {
        start : {
          '1':{
            top : '2'
          },
          '2':{
            top : 0
          }
        }
      }
    }
  }

});

Fx.Swap.Swappers.Slide = new Class({

  Extends : Fx.Swap.Swappers.Base,

  options : {
    animations : {
      before : {
        set : {
          '1' : {
            top : 0
          },
          '2' : {
            display : 'block',
            top : '-2'
          }
        }
      },
      during : {
        start : {
          '1':{
            top : 0
          },
          '2':{
            top : 0
          }
        }
      }
    }
  }

});

Fx.Swap.Swappers.Swap = new Class({

  Extends : Fx.Swap.Swappers.Base,

  options : {
    animations : {
      before : {
        start : {
          '1' : {
            top : '-1'
          }
        }
      },
      during : {
        set : {
          '2' : {
            top : '-2',
            display : 'block'
          }
        },
        start : {
          '2' : {
            top : 0
          }
        }
      }
    }
  }

});
