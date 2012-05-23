if(!window.Fx) {
  throw new Error('Fx.Swap.js: MooTools-core library not included');
}
if(!window.Fx.Elements) {
  throw new Error('Fx.Swap.js: MooTools-more library not included');
}

Fx.Swap = new Class({

  Implements : [Options, Events],

  Binds : ['onComplete'],

  Binds : [],

  options : {
    swapper : 'replace',
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

  getSwapper : function() {
    return this.swapper;
  },

  setSwapper : function(klass,options) {
    this.options.swapper = klass;
    this.swapper = new Fx.Swap[klass](options);
  },

  getSwapperClass : function() {
    return this.options.swapper.charAt(0).toUpperCase() + this.options.swapper.substr(1);
  },

  getCurrentElement : function() {
    return this.getContainer().getElement('.'+this.options.elementClassName);
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
      two.inject(this.getContainer());
    }
    this.onBeforeSwap(one,two);
    this.getSwapper().setup(this.getContainer(),one,two).start(function() {
      this.onComplete(one,two);
    }.bind(this));
  },

  onComplete : function(one, two) {
    this.onAfterSwap(one,two);
    var on = this.options.elementClassName;
    var off = this.options.hiddenClassName;
    one.removeClass(on).addClass(off);
    two.removeClass(off).addClass(on); 
  },

  onBeforeSwap : function(one,two) {
    $$(one,two).addClass('swap-active');
    one.addClass('swap-active-one');
    two.addClass('swap-active-two');
    this.hideElement(two);
  },

  onAfterSwap : function(one,two) {
    $$(one,two).removeClass('swap-active');
    one.removeClass('swap-active-one');
    two.removeClass('swap-active-two');
    this.hideElement(one);
  }

});

Fx.Swap.Replace = new Class({

  initialize : function(topContainer, options) {
    this.owner = topContainer;
    this.options = options || {};
  },

  setup : function(topContainer, containerA, containerB) {
    this.one = containerA;
    this.two = containerB;
    return this;
  },

  start : function(onComplete) {
    this.one.setStyle('display','none');
    this.two.setStyle('display','block');
    onComplete();
    return this;
  }

});

Fx.Swap.Slide = new Class({

  Implements : [Options],

  options : {
    wait : true,
    fxOptions : {
      link : 'cancel'
    },

    animate : { 
      slideOut : {
        left : [0,-20],
        opacity : 0
      },
      slideIn : {
        left : [20,0],
        opacity : 1
      }
    },
  },

  initialize : function(topContainer, options) {
    this.owner = topContainer;
    this.setOptions(options);
  },

  setup : function(topContainer, containerA, containerB) {
    topContainer.setStyle('position','relative');
    this.one = containerA;
    this.two = containerB;
    this.one.setStyles({
      'display':'block',
      'opacity':1,
      'position':'relative'
    });
    this.two.setStyles({
      'opacity':0,
      'position':'relative'
    });
    this.morphOne = new Fx.Morph(this.one,this.options.fxOptions);
    this.morphTwo = new Fx.Morph(this.two,this.options.fxOptions);
    return this;
  },

  start : function(onComplete) {
    this.onComplete = onComplete;
    this.onSlideOut(this.one,function() {
      this.onSlideIn(this.two,function() {
        this.onComplete(onComplete);
      }.bind(this));
    }.bind(this));
    return this;
  },

  onSlideOut : function(element,onReady) {
    this.morphTwo.cancel();
    this.morphOne.start(this.options.animate.slideOut);
    this.options.wait ? this.morphOne.chain(onReady) : onReady();
  },

  onSlideIn : function(element,onReady) {
    this.morphOne.cancel();
    this.morphOne.set({ 'display':'none' });
    this.morphTwo.set({ 'display':'block' });
    this.morphTwo.start(this.options.animate.slideIn);
    this.options.wait ? this.morphTwo.chain(onReady) : onReady();
  },

  onComplete : function(onComplete) {
    onComplete();
  }
});

Fx.Swap.Push = new Class({

  Implements : [Options],

  options : {
    fxOptions : {}
  },

  initialize : function(options) {
    this.setOptions(options);
  },

  setup : function(container,one,two) {
    this.container = container;
    this.container.setStyles({
      'position':'relative',
      'overflow':'hidden'
    });

    this.one = one;
    var sizesOne = one.getDimensions();
    var h1 = sizesOne.height;
    one.setStyles({
      'display':'block',
      'position':'absolute',
      'top':0,
      'left':0,
      'right':0
    });

    this.two = two;
    var sizesTwo = two.getDimensions();
    var h2 = sizesTwo.height;
    two.setStyles({
      'position':'absolute',
      'display':'block',
      'top':-h2,
      'left':0,
      'right':0
    });

    this.animator = new Fx.Elements([this.container,one,two],this.options.fxOptions);

    this.styles = {
      '0':{
        'height':[h1,h2],
      },
      '1':{
        'top':h2
      },
      '2':{
        'top':0
      }
    };

    return this;
  },

  onComplete : function(fn) {
    $$(this.one,this.two).setStyles({
      'position':'static',
      'height':'auto'
    });
    this.container.setStyles({
      'height':'auto',
      'overflow':'visible'
    });
    fn();
  },

  start : function(onComplete) {
    this.animator.start(this.styles).chain(function() {
      this.onComplete(onComplete);
    }.bind(this));
  }

});

Fx.Swap.Fade = new Class({

  Implements : [Options],

  options : {
    fxOptions : {}
  },

  initialize : function(options) {
    this.setOptions(options);
  },

  setup : function(container,one,two) {
    this.container = container;
    this.container.setStyles({
      'position':'relative',
      'overflow':'hidden'
    });

    this.one = one;
    var sizesOne = one.getDimensions();
    var h1 = sizesOne.height;
    one.setStyles({
      'opacity':1
    });

    this.two = two;
    var sizesTwo = two.getDimensions();
    var h2 = sizesTwo.height;
    two.setStyles({
      'opacity':0
    });

    $$(one,two).setStyles({
      'display':'block',
      'position':'absolute',
      'top':0,
      'left':0,
      'right':0
    });

    this.animator = new Fx.Elements([this.container,one,two],this.options.fxOptions);

    this.styles = {
      '0':{
        'height':[h1,h2],
      },
      '1':{
        'opacity':0
      },
      '2':{
        'opacity':1
      }
    };

    return this;
  },

  onComplete : function(fn) {
    $$(this.one,this.two).setStyles({
      'position':'static',
      'height':'auto'
    });
    this.container.setStyles({
      'height':'auto',
      'overflow':'visible'
    });
    fn();
  },

  start : function(onComplete) {
    this.animator.start(this.styles).chain(function() {
      this.onComplete(onComplete);
    }.bind(this));
  }

});

Fx.Swap.Cube = {

};
