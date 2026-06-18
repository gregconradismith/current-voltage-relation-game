% current voltage quiz

! rm figures/*

clear
close all
clc
set(0,'DefaultTextFontName','Courier') % Sets Font Style
s = RandStream('mt19937ar','Seed','shuffle');
RandStream.setGlobalStream(s);
set(0,'defaultaxesfontsize',20);

v = -150:1:150;
imax = 250; imin=-imax;

erev_list = [ -100 -80 0 60 120 ];
v0_list = [ -80 -60 -40 -20 ];
v1_list = [ 10 20 30 ];

for fig=1:1
    close all
    
    erev = erev_list(unidrnd(length(erev_list),1,1))
    v0 = v0_list(unidrnd(length(v0_list),1,1))
    v1 = v1_list(unidrnd(length(v1_list),1,1))
    
    g = 0.5*(1+tanh((v-v0)/v1));
    if rand<0.3, g=1-g; end
    
    figure(1)
    imem=g.*(v-erev);
    imin=min([imem -imem]);
    imax=max([imem -imem]);
    plot(v,0,'LineWidth',2,'Color','k'); hold on;
    line([0 0],[imin imax],'LineWidth',2,'Color','k'); hold on;
    plot(v,g.*(v-erev),'LineWidth',2,'Color','r');
    axis([min(v) max(v) imin imax ])
    axis off
    title('Imem(V)')
    print(['figures/ivfig_' num2str(fig) 'A' ],'-dpdf')
    
    figure(2)
    subplot(2,1,1)
    plot(v,0,'LineWidth',2,'Color','k'); hold on;
    line([0 0],[imin imax],'LineWidth',2,'Color','k'); hold on;
    plot(v,g*imax,'LineWidth',2,'Color','b'); hold on;
    plot(v,v-erev,'LineWidth',2,'Color','g');
    axis([min(v) max(v) imin imax])
    title('g(V) & V-Erev')
    axis off
    
    subplot(2,1,2)
    imem=g.*(v-erev);
    imin=min([imem -imem]);
    imax=max([imem -imem]);
    plot(v,0,'LineWidth',2,'Color','k'); hold on;
    line([0 0],[imin imax],'LineWidth',2,'Color','k'); hold on;
    plot(v,g.*(v-erev),'LineWidth',2,'Color','r');
    axis([min(v) max(v) imin imax ])
    axis off
    title('Imem(V)')
    print(['figures/ivfig_' num2str(fig) 'B' ],'-dpdf')
    
end



